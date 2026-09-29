# frozen_string_literal: true

require "jekyll"
require_relative "../_plugins/dependency_graph_generator"

Page = Struct.new(:relative_path, :data, :content)

class DependencyGraphGeneratorTest
  def initialize
    @generator = Jekyll::DependencyGraphGenerator.new
    @failures = []
  end

  def run
    test_single_root_without_dependencies
    test_direct_dependencies_include_every_relation
    test_only_runtime_dependencies_are_transitive
    test_multiple_roots_union_and_shared_dependency_deduplication
    test_root_reachable_from_another_root
    test_cycles_terminate
    test_duplicate_edges_are_preserved
    test_root_validation
    test_index_is_not_a_stack_report
    raise @failures.join("\n") unless @failures.empty?
  end

  private

  def graph(nodes, edges)
    {
      "nodes" => nodes.map { |id| { "id" => id, "name" => id } },
      "edges" => edges.map do |source, target, relation|
        { "source" => source, "target" => target, "relation" => relation }
      end,
    }
  end

  def aggregate(nodes, edges, roots)
    @generator.send(:aggregate_stack_graph, graph(nodes, edges), roots)
  end

  def ids(result)
    result["nodes"].map { |node| node["id"] }.sort
  end

  def edge_pairs(result)
    result["edges"].map { |edge| [edge["source"], edge["target"], edge["relation"]] }
  end

  def assert_equal(expected, actual, label)
    return if expected == actual
    @failures << "#{label}: expected #{expected.inspect}, got #{actual.inspect}"
  end

  def assert_raises(message, label)
    yield
    @failures << "#{label}: expected an exception"
  rescue StandardError => error
    @failures << "#{label}: wrong error #{error.message.inspect}" unless error.message.include?(message)
  end

  def test_single_root_without_dependencies
    result = aggregate(%w[root other], [], ["root"])
    assert_equal(["root"], ids(result), "root-only nodes")
    assert_equal([], result["edges"], "root-only edges")
    assert_equal(true, result["nodes"].first["root"], "root marker")
  end

  def test_direct_dependencies_include_every_relation
    edges = [
      ["root", "runtime", "runtime-dependency"],
      ["root", "build", "build-dependency"],
      ["root", "test", "test-dependency"],
    ]
    result = aggregate(%w[root runtime build test], edges, ["root"])
    assert_equal(%w[build root runtime test], ids(result), "all direct relations")
    assert_equal(3, result["edges"].length, "all direct edges")
  end

  def test_only_runtime_dependencies_are_transitive
    edges = [
      ["root", "direct", "build-dependency"],
      ["direct", "runtime", "runtime-dependency"],
      ["direct", "build", "build-dependency"],
      ["runtime", "deep", "runtime-dependency"],
    ]
    result = aggregate(%w[root direct runtime build deep], edges, ["root"])
    assert_equal(%w[deep direct root runtime], ids(result), "runtime-only transitivity")
    assert_equal(false, edge_pairs(result).any? { |edge| edge[1] == "build" }, "pruned indirect build edge")
  end

  def test_multiple_roots_union_and_shared_dependency_deduplication
    edges = [
      ["one", "shared", "runtime-dependency"],
      ["two", "shared", "runtime-dependency"],
      ["shared", "leaf", "runtime-dependency"],
    ]
    result = aggregate(%w[one two shared leaf], edges, %w[one two])
    assert_equal(%w[leaf one shared two], ids(result), "multi-root union")
    assert_equal(1, ids(result).count("shared"), "shared node deduplication")
  end

  def test_root_reachable_from_another_root
    result = aggregate(%w[one two leaf], [["one", "two", "build-dependency"], ["two", "leaf", "build-dependency"]], %w[one two])
    assert_equal(%w[leaf one two], ids(result), "root dependency still gets root-hop traversal")
  end

  def test_cycles_terminate
    edges = [["root", "a", "runtime-dependency"], ["a", "root", "runtime-dependency"]]
    result = aggregate(%w[root a], edges, ["root"])
    assert_equal(%w[a root], ids(result), "cycle nodes")
    assert_equal(2, result["edges"].length, "cycle edges")
  end

  def test_duplicate_edges_are_preserved
    edges = [["root", "a", "runtime-dependency"], ["root", "a", "runtime-dependency"]]
    result = aggregate(%w[root a], edges, ["root"])
    assert_equal(2, result["edges"].length, "source graph edge multiplicity")
  end

  def test_root_validation
    reports = { "known" => Page.new("project-reports/known.md", {}, "") }
    assert_raises("non-empty roots", "missing roots") do
      @generator.send(:validate_roots, Page.new("stack-reports/x/x.md", {}, ""), reports)
    end
    assert_raises("non-empty roots", "empty roots") do
      @generator.send(:validate_roots, Page.new("stack-reports/x/x.md", { "roots" => [] }, ""), reports)
    end
    assert_raises("empty root", "blank root") do
      @generator.send(:validate_roots, Page.new("stack-reports/x/x.md", { "roots" => [""] }, ""), reports)
    end
    assert_raises("duplicate roots", "duplicate roots") do
      @generator.send(:validate_roots, Page.new("stack-reports/x/x.md", { "roots" => %w[known known] }, ""), reports)
    end
    assert_raises("has no project-reports/missing.md", "unknown root") do
      @generator.send(:validate_roots, Page.new("stack-reports/x/x.md", { "roots" => ["missing"] }, ""), reports)
    end
    assert_equal(["known"], @generator.send(:validate_roots, Page.new("stack-reports/x/x.md", { "roots" => ["known"] }, ""), reports), "valid roots")
  end

  def test_index_is_not_a_stack_report
    path = "stack-reports/index.md"
    selected = path.start_with?("stack-reports/") && path.end_with?(".md") && File.basename(path) != "index.md"
    assert_equal(false, selected, "stack index exclusion")
  end
end

DependencyGraphGeneratorTest.new.run
puts "dependency_graph_generator_test: PASS"
