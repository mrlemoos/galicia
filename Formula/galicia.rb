class Galicia < Formula
  desc "Concise engineering skills and project-local context for coding agents"
  homepage "https://github.com/mrlemoos/galicia"
  url "https://github.com/mrlemoos/galicia/releases/download/v0.1.3/galicia-0.1.3.tar.gz"
  sha256 "7209f5c7b20cd879177f48c58ea270967a56158669ee785ea0bb40a57629cbfe"
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
    assert_equal "0.1.3", shell_output("#{bin}/galicia --version").strip
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
