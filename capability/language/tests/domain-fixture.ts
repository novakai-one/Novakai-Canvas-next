export const prototype =
  'canvas 1\ncollection @prototype "From idea to a frontend prototype" theme=ink {\n  asset @wireframe image source="assets/wireframe.svg"\n    alt="A wireframe with a navigation bar, content cards and a primary action"\n  node @brief step "Understand the task" step=1 {\n    text @detail "Identify the audience and the problem to solve."\n  }\n  node @scope step "Choose one useful journey" step=2 {\n    text @detail "Define the outcome and what this prototype must demonstrate."\n  }\n  node @sketch step "Sketch the screen" step=3 {\n    image @screen asset=@wireframe\n    text @detail "Make the hierarchy and the next action obvious."\n  }\n  node @build step "Build the prototype" step=4 {\n    text @detail "Implement the chosen journey with realistic content."\n  }\n  node @review decision "Does the journey work?" step=5 {\n    text @detail "Try the task with a person. Observe where they hesitate."\n  }\n  node @refine step "Refine the weak point" step=6 {\n    text @detail "Change the smallest thing that improves understanding."\n  }\n  node @share end "Share what you learned" step=7 {\n    text @detail "Show the prototype, decisions and remaining questions."\n  }\n  wire @scope-work @brief -> @scope "Clarify" kind=flow\n  wire @make-sketch @scope -> @sketch "Prioritize" kind=flow\n  wire @implement @sketch -> @build "Build" kind=flow\n  wire @try-task @build -> @review "Observe" kind=flow\n  wire @needs-work @review -> @refine "No \u00b7 improve" kind=flow\n  wire @try-again @refine -> @review "Try again" kind=flow style=dashed\n  wire @ready @review -> @share "Yes \u00b7 explain" kind=flow\n  section @journey "A small, testable learning loop" mode=flow layout=flow direction=right {\n    show @brief @scope @sketch @build @review @refine @share\n    connect @scope-work @make-sketch @implement @try-task @needs-work @try-again @ready\n    rank @brief @scope @sketch @build\n    rank @review @refine @share\n    below @review @build\n    before @refine @share\n  }\n}\n';
export const contentSource = String.raw`canvas 1 collection @content "Contents" {
 asset @wireframe image source="sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" alt="A wireframe with a navigation bar, content cards and a primary action"
 node @card note "Text and structured data" {
   text @intro "Unicode 🧠\nsecond line\tTabbed \"quote\" and \\ slash"
   code @code "const answer = 42;" language="typescript"
   link @local "Read the note" target=@card section=@story
   link @external "Source" target="https://example.com/paper"
   list @steps ["First", "Second"] ordered=true
   image @preview asset=@wireframe size=small fit=cover
   icon @symbol asset=@wireframe size=small
   table @facts columns=["Name", "Value"] { row @one cells=["a", "b"] }
 }
 section @story "Explain" mode=story { show @card }
}`;
export const groupedSource = `canvas 1 collection @groups "Grouped" layout=grid direction=down gap=roomy {
 node @a step "A" {} node @b step "B" {} node @border system "Boundary" {}
 section @main "Main" mode=story {
   group @outer "Outer" represents=@border layout=grid {
     show @a
     group @inner "Inner" { show @b }
     before @a group:@inner
   }
 }
 section @other "Other" mode=grid { show @a }
 below section:@other section:@main
}`;
export const treeSource = `canvas 1 collection @tree "Mindmap" {
 node @topic concept "Topic" {} node @child concept "Detail" {} node @legend note "Legend" {}
 wire @parent @topic -> @child "Contains" kind=parent
 section @map "Map" mode=tree { root @topic show @topic @child @legend connect @parent }
}`;
