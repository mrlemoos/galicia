class Galicia < Formula
  desc "Concise engineering skills and project-local context for coding agents"
  homepage "https://github.com/mrlemoos/galicia"
  url "https://github.com/mrlemoos/galicia/releases/download/v0.1.0/galicia-0.1.0.tar.gz"
  sha256 "d71ad028bf8894a949d6601b6f4bdaa82f514fb6f7a66365fbff291955ceb29d"
  license "MIT"

  depends_on "node"

  def install
    libexec.install "src", "templates", "package.json", "LICENSE", "NOTICE.md", "terse", "rubberduck", "spec", "breakdown", "find-rc"
    bin.mkpath
    (bin/"galicia").write <<~SH
      #!/bin/sh
      export PATH="#{Formula["node"].opt_bin}:$PATH"
      exec "#{Formula["node"].opt_bin}/node" "#{libexec}/src/cli.ts" "$@"
    SH
    (bin/"galicia").chmod 0755
  end

  test do
    assert_equal "0.1.0", shell_output("#{bin}/galicia --version").strip
    ENV["GALICIA_NO_UPDATE_CHECK"] = "1"
    project = testpath/"project"
    project.mkpath
    cd project do
      system bin/"galicia", "init", "--agents", "codex,claude,cursor,grok", "--hooks", "--yes"
      assert_path_exists project/".agents/skills/terse/SKILL.md"
      assert_path_exists project/".claude/skills/spec/SKILL.md"
      assert_path_exists project/".galicia/prompts/find-rc.md"
      assert_match "Already initialised", shell_output("#{bin}/galicia init --agents codex,claude,cursor,grok --hooks --yes")
      system bin/"galicia", "check"
      system Formula["node"].opt_bin/"node", project/".galicia/check.ts"
    end
  end
end
