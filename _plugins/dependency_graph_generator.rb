# frozen_string_literal: true

require "yaml"
require "json"
require "fileutils"

# Aggregates the direct dependencies every project-reports/*.md declares in its own `dependencies:`
# frontmatter into one shared graph, resolving names against projects.yml. Runs on every `jekyll
# build` (see .github/workflows/deploy-website.yml) so the graph is always current -- unlike
# stack-report's own <slug>.graph.json, which is generated once at report-authoring time and
# committed. See assets/js/dependency-graph.js / _includes/dependency-graph.html for how it's
# rendered: indirect dependencies are derived client-side by BFS over these direct edges alone, so
# only direct edges are ever produced here.
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
        p.relative_path.start_with?("project-reports/") && p.relative_path.end_with?(".md")
      end

      nodes = {}
      report_pages.each do |page|
        id = File.basename(page.relative_path, ".md")
        nodes[id] = report_node(site, id, page, by_name)
      end

      edges = []
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

      json = JSON.pretty_generate("nodes" => nodes.values, "edges" => edges)
      site.static_files << DependencyGraphFile.new(site, "project-reports", "dependencies.graph.json", json)
    end

    private

    def load_registry(site)
      YAML.load_file(File.join(site.source, "projects.yml")) || []
    end

    def normalize(name)
      name.to_s.downcase.strip
    end

    # Mirrors registryByName/lookupRegistry in prompts/stack-report/stack-report-workflow.js: index
    # every entry by its canonical name and every synonym so either resolves to the one entry.
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
    # name.toLowerCase().replace(/[\s.\/]+/g, '-')`), not stack-report's more aggressive nodeId() --
    # this is the sibling system whose filename convention must match if it ever gains a report.
    def registry_node_id(entry)
      if entry["report"]
        File.basename(entry["report"], ".md")
      else
        entry["name"].to_s.downcase.gsub(/[\s.\/]+/, "-")
      end
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
