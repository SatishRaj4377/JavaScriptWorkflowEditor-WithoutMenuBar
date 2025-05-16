var toolbarItems = [
  { id: "New",
    text: "New",
    tooltipText: "New Diagram",
    prefixIcon: "e-icons e-file"
  },
  { id: "Open",
    text: "Open",
    tooltipText: "Open Diagram",
    prefixIcon: "e-icons e-folder-open"
  },
  { id: "Save",
    text: "Save",
    tooltipText: "Save Diagram",
    prefixIcon: "e-icons e-save"
  },
  { type: "Separator" },
  {
    id: "Execute",
    text: "Execute",
    tooltipText: "Start Workflow",
    prefixIcon: "e-icons e-play",
  },
  {
    id: "Reset",
    text: "Reset",
    tooltipText: "Reset View/State",
    prefixIcon: "e-icons e-reset",
  },
  {
    id: "Delete",
    text: "Delete",
    tooltipText: "Delete Selected",
    prefixIcon: "e-icons e-delete-2",
  },
  { type: "Separator" },
  {
    id: "Select",
    text: "Select",
    tooltipText: "Select Tool",
    prefixIcon: "e-icons e-mouse-pointer",
  },
  {
    id: "Pan",
    text: "Pan",
    tooltipText: "Pan Tool",
    prefixIcon: "e-icons e-pan",
  },
  { type: "Separator" },
  {
    id: "empty",
    text: "",
  },
];

// Hidden file input for JSON import
var input = document.createElement("input");
input.type = "file";
input.accept = ".json";
input.id = "fileInput";
input.style.display = "none";
document.body.appendChild(input);

input.addEventListener("change", function (e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (evt) {
    var json = JSON.parse(evt.target.result);
    window.diagram.loadDiagram(json);
    updateExecuteButton('Execute');
    clearAnimationIntervals();
    diagram.tool = ej.diagrams.DiagramTools.ZoomPan;
    input.value = "";
  };
  reader.readAsText(file);
});

var selectedTool = "Pan";

(function () {
  // Helper to toggle the Execute button among Execute, Pause, Resume
  function updateExecuteButton(state) {
    const btn = toolbarObj.items[4];
    if (state === "Pause") {
      btn.id = "Pause";
      btn.text = "Pause";
      btn.tooltipText = "Pause Workflow";
      btn.prefixIcon = "e-icons e-pause";
    } else if (state === "Resume") {
      btn.id = "Resume";
      btn.text = "Resume";
      btn.tooltipText = "Resume Workflow";
      btn.prefixIcon = "e-icons e-play";
    } else {
      // back to fresh Execute
      btn.id = "Execute";
      btn.text = "Execute";
      btn.tooltipText = "Start Workflow";
      btn.prefixIcon = "e-icons e-play";
    }
    toolbarObj.refresh();
    document.getElementById(selectedTool).classList.add("tb-item-selected");
  }

  function selectToolbarItem(args) {
    let el = document.getElementById(args.item.id);
    if (el) {
      toolbarObj.element
        .querySelectorAll(".tb-item-selected")
        .forEach(i => i.classList.remove("tb-item-selected"));
      if (args.item.id === "Select" || args.item.id === "Pan") {
        el.classList.add("tb-item-selected");
      }
    }
  }

  // initialize the toolbar
  window.toolbarObj = new ej.navigations.Toolbar({
    enableToggle: false,
    items: toolbarItems,
    clicked: function (args) {
      selectToolbarItem(args);
      switch (args.item.id) {
        case "New":
          updateExecuteButton("Execute");
          clearAnimationIntervals();
          diagram.clear();
          break;
        case "Open":
          document.getElementById("fileInput").click();
          break;
        case "Save":
          saveDiagram();
          break;
        case "Execute":
        case "Pause":
        case "Resume":
          diagram.clearSelection();
          startWorkflow();
          break;
        case "Reset":
          resetWorkflow();
          updateExecuteButton("Execute");
          break;
        case "Delete":
          diagram.selectedItems.nodes.forEach(n => diagram.remove(n));
          diagram.selectedItems.connectors.forEach(c => diagram.remove(c));
          break;
        case "Select":
          diagram.tool = ej.diagrams.DiagramTools.MulipleSelect;
          selectedTool = "Select";
          break;
        case "Pan":
          diagram.tool = ej.diagrams.DiagramTools.ZoomPan;
          selectedTool = "Pan";
          break;
      }
    },
  });
  toolbarObj.appendTo("#toolbar");

  // Save to JSON and trigger download
  function saveDiagram() {
      // 1. Set default filename
      const fileName = "Diagram.json";

      // 2. Serialize diagram to JSON
      const jsonData = window.diagram.saveDiagram();

      // 3. Trigger download
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  }

  // Keep "Pan" tool selected by default
  document.getElementById('Pan').classList.add('tb-item-selected');
  diagram.tool = ej.diagrams.DiagramTools.ZoomPan;

  // expose to index.js
  window.updateExecuteButton = updateExecuteButton;
})();


