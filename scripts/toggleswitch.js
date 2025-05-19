(function () {
  var toggleSwitch = new ej.buttons.Switch({
    checked: false, // false = View, true = Edit
    cssClass: "custom-switch",
    change: function (args) {
      applyModeState(args.checked);
      updateTooltipContent(args.checked);
    },
  });

  toggleSwitch.appendTo("#switchMode");

  // Add Syncfusion tooltip
    var switchTooltip = new ej.popups.Tooltip({
    content: 'Enable Editing',
    target: '#switch-container',
    position: 'TopCenter',
    opensOn: 'Hover'
    });
    switchTooltip.appendTo('#switch-container');

    // Function to update tooltip content based on switch state
    function updateTooltipContent(isChecked) {
    switchTooltip.content = isChecked ? 'Disable Editing' : 'Enable Editing';
    }

  function applyModeState(isEditMode) {
    const buttonsToToggle = ["Select", "Delete", "Save"];

    if (window.toolbarObj) {
      window.toolbarObj.items.forEach((item) => {
        if (buttonsToToggle.includes(item.id)) {
          item.disabled = !isEditMode;
        }
      });

      // 🧩 Hide last separator if palette is hidden
      const items = window.toolbarObj.items;
      const lastSepIndex = items.findIndex(
        (item) => item.type === "Separator" && items.indexOf(item) > 7
      );
      if (lastSepIndex !== -1) {
        items[lastSepIndex].visible = isEditMode;
      }
      window.toolbarObj.refresh();
    }

    // Show/hide stencil palette
    const palette = document.getElementById("symbolPalette");
    if (palette) {
      palette.style.display = isEditMode ? "block" : "none";
    }

    // Set tool to Pan in view mode
    if (diagram) {
      if (isEditMode) {
        diagram.tool = ej.diagrams.DiagramTools.MulipleSelect;

        const toolbarItems = document.querySelectorAll(
          "#toolbar .e-toolbar-item"
        );
        toolbarItems.forEach((el) => el.classList.remove("tb-item-selected"));
        const selectButton = document.getElementById("Select");
        if (selectButton) selectButton.classList.add("tb-item-selected");
      } else {
        diagram.tool = ej.diagrams.DiagramTools.ZoomPan;
        const toolbarItems = document.querySelectorAll(
          "#toolbar .e-toolbar-item"
        );
        toolbarItems.forEach((el) => el.classList.remove("tb-item-selected"));
        const panButton = document.getElementById("Pan");
        if (panButton) panButton.classList.add("tb-item-selected");
      }
    }
  }

  applyModeState(toggleSwitch.checked);
  updateTooltip(toggleSwitch.checked);

})();
