# frozen_string_literal: true

require "yaml"
require "json"
require "fileutils"

# Aggregates the direct dependencies every project-reports/*.md declares in its own `dependencies:`
# frontmatter into one shared graph, and derives stack graphs from each stack report's `roots:` list.
# Runs on every `jekyll build` so both graph types stay current. See assets/js/dependency-graph.js /
# _includes/dependency-graph.html for rendering.
module Jekyll
  class DependencyGraphFile < StaticFile
    def initialize(site, dir, name, content)
      super(site, site.source, dir, name)
      @content = content
    end

    # No on-disk source backs this file (it's computed below), so write the precomputed JSON
    # directly instead of the default StaticFile behavior of copying `path` to `dest`.
    def write(dest)
      path = File.join(dest, @dir, @name)
      FileUtils.mkdir_p(File.dirname(path))
      File.write(path, @content)
      true
    end
  end

  class DependencyGraphGenerator < Generator
    def generate(site)
      by_name = index_registry(load_registry(site))
      report_pages = site.pages.select do |p|
        p.relative_path.start_with?("project-reports/") &&
          p.relative_path.end_with?(".md") &&
          File.basename(p.relative_path) != "index.md"
      end

      graph = build_graph(site, report_pages, by_name)
      json = JSON.pretty_generate(graph)
      site.static_files << DependencyGraphFile.new(site, "project-reports", "dependencies.graph.json", json)
      generate_stack_graphs(site, report_pages, graph)
    end

    private

    def load_registry(site)
      YAML.load_file(File.join(site.source, "projects.yml")) || []
    end

    def normalize(name)
      name.to_s.downcase.strip
    end

    # Index every entry by its canonical name and every synonym so either resolves to one entry.
    def index_registry(registry)
      by_name = {}
      registry.each do |entry|
        next unless entry && entry["name"]
        by_name[normalize(entry["name"])] ||= entry
        (entry["synonyms"] || []).each { |syn| by_name[normalize(syn)] ||= entry }
      end
      by_name
    end

    # A dependency target with its own report is keyed by that report's filename slug, so it
    # unifies with the node report_node builds for that same page below. One with no report is
    # keyed by the simple name-slug rule from project-report-workflow.js (`slug =
    # name.toLowerCase().replace(/[\s.\/]+/g, '-')`), whose filename convention it must match if it
    # ever gains a report.
    def registry_node_id(entry)
      if entry["report"]
        File.basename(entry["report"], ".md")
      else
        entry["name"].to_s.downcase.gsub(/[\s.\/]+/, "-")
      end
    end

    def build_graph(site, report_pages, by_name)
      nodes = {}
      edges = []
      report_pages.each do |page|
        id = File.basename(page.relative_path, ".md")
        nodes[id] = report_node(site, id, page, by_name)
      end

      report_pages.each do |page|
        source_id = File.basename(page.relative_path, ".md")
        (page.data["dependencies"] || []).each do |dep|
          name = dep["name"]
          entry = by_name[normalize(name)]
          unless entry
            raise "dependency_graph_generator: #{page.relative_path} names dependency " \
                  "#{name.inspect}, which has no projects.yml entry -- add one before this " \
                  "report can build"
          end

          target_id = registry_node_id(entry)
          nodes[target_id] ||= leaf_node(entry)
          edges << {
            "source" => source_id,
            "target" => target_id,
            "relation" => dep["relation"],
            "criticality" => dep["criticality"],
          }
        end
      end
      { "nodes" => nodes.values, "edges" => edges }
    end

    def generate_stack_graphs(site, report_pages, graph)
      reports_by_slug = report_pages.each_with_object({}) do |page, result|
        result[File.basename(page.relative_path, ".md")] = page
      end
      stack_pages = site.pages.select do |page|
        page.relative_path.start_with?("stack-reports/") &&
          page.relative_path.end_with?(".md") &&
          File.basename(page.relative_path) != "index.md"
      end

      stack_pages.each do |page|
        slug = File.basename(page.relative_path, ".md")
        roots = validate_roots(page, reports_by_slug)
        page.content = "{% include dependency-graph.html slug=\"#{slug}\" %}\n"

        stack = aggregate_stack_graph(graph, roots)
        stack["roots"] = roots
        content = JSON.pretty_generate(stack)
        site.static_files << DependencyGraphFile.new(
          site, File.dirname(page.relative_path), "#{slug}.graph.json", content
        )
      end
    end

    def validate_roots(page, reports_by_slug)
      roots = page.data["roots"]
      unless roots.is_a?(Array) && !roots.empty?
        raise "dependency_graph_generator: #{page.relative_path} must define a non-empty roots list"
      end
      roots = roots.map(&:to_s)
      if roots.any?(&:empty?)
        raise "dependency_graph_generator: #{page.relative_path} contains an empty root"
      end
      if roots.uniq.length != roots.length
        raise "dependency_graph_generator: #{page.relative_path} contains duplicate roots"
      end
      roots.each do |root|
        unless reports_by_slug.key?(root)
          raise "dependency_graph_generator: #{page.relative_path} root #{root.inspect} " \
                "has no project-reports/#{root}.md"
        end
      end
      roots
    end

    def aggregate_stack_graph(graph, roots)
      nodes = graph["nodes"]
      edges = graph["edges"]
      outgoing = Hash.new { |hash, key| hash[key] = [] }
      edges.each { |edge| outgoing[edge["source"]] << edge }
      visible = {}
      roots.each { |root| visible[root] = true }
      queue = roots.map { |root| [root, true] }
      until queue.empty?
        source, root_hop = queue.shift
        outgoing[source].each do |edge|
          next if !root_hop && !runtime_relation?(edge["relation"])
          target = edge["target"]
          next if visible[target]
          visible[target] = true
          queue << [target, false]
        end
      end

      {
        "nodes" => nodes.select { |node| visible[node["id"]] }.map do |node|
          node.merge("root" => roots.include?(node["id"]))
        end,
        "edges" => edges.select do |edge|
          visible[edge["source"]] && visible[edge["target"]] &&
            (roots.include?(edge["source"]) || runtime_relation?(edge["relation"]))
        end
      }
    end

    def runtime_relation?(relation)
      value = relation.to_s.downcase
      value.include?("runtime") && !value.include?("build") && !value.include?("test")
    end

    def report_node(site, id, page, by_name)
      entry = by_name[normalize(page.data["title"])]
      {
        "id" => id,
        "name" => page.data["title"] || id,
        "color" => page.data["color"] || "grey",
        "in_scope" => true,
        "repo" => entry && entry["repo"],
        "home" => entry && entry["home"],
        "report" => "#{site.baseurl}/project-reports/#{id}.html",
      }
    end

    def leaf_node(entry)
      {
        "id" => registry_node_id(entry),
        "name" => entry["name"],
        "color" => "grey",
        "in_scope" => false,
        "repo" => entry["repo"],
        "home" => entry["home"],
        "report" => nil,
      }
    end
  end
end
