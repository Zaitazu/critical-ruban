class BannerPositionPicker extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "critical-ruban-position-picker",
      title: game.i18n.localize("critical-ruban.positionPicker.title"),
      template: `modules/${MODULE_ID}/templates/banner-position-picker.hbs`,
      width: 430,
      closeOnSubmit: false,
      submitOnChange: false,
      submitOnClose: false,
      resizable: false
    });
  }

  async getData() {
    return {
      useCustomPos: game.settings.get(MODULE_ID, "useCustomPos") ?? false
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("[data-action='pick']").on("click", async (ev) => {
      ev.preventDefault();
      await this.close();
      await openPixiBannerPositionPicker();
    });

    html.find("[data-action='reset']").on("click", async (ev) => {
      ev.preventDefault();
      destroyBannerPositionPreview();

      await game.settings.set(MODULE_ID, "bannerPosX", null);
      await game.settings.set(MODULE_ID, "bannerPosY", null);
      await game.settings.set(MODULE_ID, "useCustomPos", false);

      ui.notifications.info(
        game.i18n.localize("critical-ruban.positionPicker.resetNotification")
      );

      this.render(true);
    });
  }

  async close(options) {
    destroyBannerPositionPreview();
    return super.close(options);
  }
}

globalThis.BannerPositionPicker = BannerPositionPicker;