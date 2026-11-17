# frozen_string_literal: true

require "rake"

files = FileList["test/**/*_test.rb"]

desc "Run automated tests"
task :test do
  files.each { |file| ruby file }
end

task default: :test
