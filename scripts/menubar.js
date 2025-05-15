document.addEventListener("DOMContentLoaded", function () {
  let showRulers = true;
  let showLines = true;
  // 1) Your menu‑item data‑sources (unchanged)
  var dropDownDataSources = {
    getFileMenuItems: function () {
      return [
        { text: "New", iconCss: "e-icons e-file" },
        { text: "Open", iconCss: "e-icons e-folder-open" },
        { text: "Save", iconCss: "e-icons e-save" },
      ];
    },
    getEditMenuItems: function () {
      return [
        { text: "Cut", iconCss: "e-icons e-cut" },
        { text: "Copy", iconCss: "e-icons e-copy" },
        { text: "Paste", iconCss: "e-icons e-paste" },
        { text: "Delete", iconCss: "e-icons e-delete-2" },
      ];
    },
    getSelectMenuItems: function () {
      return [
        { text: "Select All" },
        { text: "Select All Nodes" },
        { text: "Select All Connectors" },
        { text: "DeSelect All" },
      ];
    },
    getViewMenuItems: function () {
      return [
        { text: "Zoom In", iconCss: "e-icons e-zoom-in" },
        { text: "Zoom Out", iconCss: "e-icons e-zoom-out" },
        { separator: true },
        { text: "Fit To Screen", iconCss: "e-icons e-zoom-to-fit" },
        { separator: true },
        { text: "Show Rulers", iconCss: "e-icons e-check" },
        { text: "Show Lines", iconCss: "e-icons e-check" },
      ];
    },
  };

  // 2) Utility methods: map menu text → Diagram actions
  var utilityMethods = {
    menuClick: function (args) {
      var cmd = args.item.text;
      var diag = window.diagram; // your EJ2 Diagram instance
      switch (cmd) {
        // — FILE —
        case "New":
          diag.clear();
          break;
        case "Open":
          document.getElementById("fileInput").click();
          break;
        case "Save":
          saveDiagram();
          break;

        // — EDIT —
        case "Cut":
          diag.cut();
          break;
        case "Copy":
          diag.copy();
          break;
        case "Paste":
          diag.paste();
          break;
        case "Delete":
          // remove all selected nodes/connectors
          var sel = diag.selectedItems;
          diag.remove(sel.nodes.concat(sel.connectors));
          break;

        // — SELECT (nodes/connectors) —
        case "Select All":
          diag.selectAll();
          break;
        case "Select All Nodes":
            diag.clearSelection();
            diag.select(diag.nodes);
          break;
        case "Select All Connectors":
            diag.clearSelection();
            diag.select(diag.connectors);
          break;
        case "DeSelect All":
          diag.clearSelection();
          break;

        // — VIEW —
        case "Zoom In":
          diag.zoomTo({ type: "ZoomIn", zoomFactor: 0.2 });
          break;
        case "Zoom Out":
          diag.zoomTo({ type: "ZoomOut", zoomFactor: 0.2 });
          break;
        case "Fit To Screen":
          diag.fitToPage();
          break;
        case "Show Rulers":
          showRulers = !showRulers;
          diag.rulerSettings.showRulers = showRulers;
          diag.dataBind();
          break;
        case "Show Lines":
          showLines = !showLines;
          if (showLines) {
            diag.snapSettings.constraints |=
              ej.diagrams.SnapConstraints.ShowLines;
          } else {
            diag.snapSettings.constraints &=
              ~ej.diagrams.SnapConstraints.ShowLines;
          }
          diag.dataBind();
          break;
      }

      const updated = viewBtn.items.map((item) => {
        if (item.separator) {
          return item;
        }

        if (item.text === "Show Rulers") {
          return { ...item, iconCss: showRulers ? "e-icons e-check" : "" };
        }
        if (item.text === "Show Lines") {
          return { ...item, iconCss: showLines ? "e-icons e-check" : "" };
        }
        return item;
      });

      viewBtn.setProperties({ items: updated }, true);
    },
  };

  // 3) File Open/Save helpers
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
    };
    reader.readAsText(file);
  });

  // Save to JSON and trigger download
  function saveDiagram() {
    // 1. Read and sanitize the title
    const titleEl = document.getElementById("diagramTitle");
    const rawTitle = titleEl.innerText.trim() || "";
    const defaultLabel = "Untitled Diagram";
    // strip any characters illegal in filenames
    const safeTitle = rawTitle.replace(/[\\\/:*?"<>|]/g, "").trim();
    // decide on filename
    const baseName =
      safeTitle && safeTitle !== defaultLabel ? safeTitle : "Diagram";
    const fileName = baseName + ".json";

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

  // 4) Instantiate each dropdown, wiring the select handler
  new ej.splitbuttons.DropDownButton(
    {
      cssClass: "db-dropdown-menu",
      items: dropDownDataSources.getFileMenuItems(),
      content: "File",
      select: utilityMethods.menuClick,
    },
    "#btnFileMenu"
  );

  new ej.splitbuttons.DropDownButton(
    {
      cssClass: "db-dropdown-menu",
      items: dropDownDataSources.getEditMenuItems(),
      content: "Edit",
      select: utilityMethods.menuClick,
    },
    "#btnEditMenu"
  );

  new ej.splitbuttons.DropDownButton(
    {
      cssClass: "db-dropdown-menu",
      items: dropDownDataSources.getSelectMenuItems(),
      content: "Select",
      select: utilityMethods.menuClick,
    },
    "#btnSelectMenu"
  );

  const viewBtn = new ej.splitbuttons.DropDownButton(
    {
      cssClass: "db-dropdown-menu",
      items: dropDownDataSources.getViewMenuItems(),
      content: "View",
      select: utilityMethods.menuClick,
    },
    "#btnViewMenu"
  );
});
