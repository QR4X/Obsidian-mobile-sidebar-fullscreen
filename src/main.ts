import {
	App,
	Platform,
	Plugin,
	PluginSettingTab,
	Setting,
	setIcon,
} from "obsidian";

interface MobileSidebarFullscreenSettings {
	fullWidthSidebar: boolean;
	sidebarWidthPercent: number;
	reclaimSpaceOnAutoHide: boolean;
	addNavbarButton: boolean;
	hideToolbarInFullscreen: boolean;
}

const DEFAULT_SETTINGS: MobileSidebarFullscreenSettings = {
	fullWidthSidebar: true,
	sidebarWidthPercent: 100,
	reclaimSpaceOnAutoHide: true,
	addNavbarButton: true,
	hideToolbarInFullscreen: false,
};

const CLASS_SIDEBAR_FULL = "msf-sidebar-full";
const CLASS_RECLAIM = "msf-reclaim-space";
const CLASS_FULLSCREEN = "msf-fullscreen";
const CLASS_HIDE_TOOLBAR = "msf-hide-toolbar";
const NAVBAR_BUTTON_CLASS = "msf-navbar-toggle";
const EXIT_BUTTON_CLASS = "msf-exit-button";

export default class MobileSidebarFullscreenPlugin extends Plugin {
	settings: MobileSidebarFullscreenSettings = { ...DEFAULT_SETTINGS };
	private navbarButtonEl: HTMLElement | null = null;
	private exitButtonEl: HTMLElement | null = null;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "toggle-fullscreen",
			name: "Vollbild umschalten",
			icon: "maximize",
			checkCallback: (checking: boolean) => {
				if (!Platform.isPhone) {
					return false;
				}
				if (!checking) {
					this.toggleFullscreen();
				}
				return true;
			},
		});

		this.addSettingTab(new MobileSidebarFullscreenSettingTab(this.app, this));

		this.createExitButton();
		this.applySettings();

		this.app.workspace.onLayoutReady(() => this.refreshNavbarButton());
	}

	onunload() {
		const body = document.body;
		body.removeClass(
			CLASS_SIDEBAR_FULL,
			CLASS_RECLAIM,
			CLASS_FULLSCREEN,
			CLASS_HIDE_TOOLBAR,
		);
		body.style.removeProperty("--msf-drawer-width");

		this.exitButtonEl?.detach();
		this.exitButtonEl = null;
		this.navbarButtonEl?.detach();
		this.navbarButtonEl = null;
	}

	toggleFullscreen() {
		this.setFullscreen(!document.body.hasClass(CLASS_FULLSCREEN));
	}

	setFullscreen(enabled: boolean) {
		document.body.toggleClass(CLASS_FULLSCREEN, enabled);
	}

	private applySettings() {
		const body = document.body;
		body.toggleClass(CLASS_SIDEBAR_FULL, this.settings.fullWidthSidebar);
		body.toggleClass(CLASS_RECLAIM, this.settings.reclaimSpaceOnAutoHide);
		body.toggleClass(CLASS_HIDE_TOOLBAR, this.settings.hideToolbarInFullscreen);
		body.style.setProperty(
			"--msf-drawer-width",
			`${this.settings.sidebarWidthPercent}vw`,
		);
		this.refreshNavbarButton();
	}

	private createExitButton() {
		const button = document.body.createDiv(
			`${EXIT_BUTTON_CLASS} clickable-icon tappable`,
		);
		button.setAttribute("aria-label", "Vollbild beenden");
		setIcon(button, "minimize");
		this.registerDomEvent(button, "click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			this.setFullscreen(false);
		});
		this.exitButtonEl = button;
	}

	private getNavbarActions(): HTMLElement | null {
		const mobileNavbar = (
			this.app as unknown as { mobileNavbar?: { containerEl?: HTMLElement } }
		).mobileNavbar;
		const fromApp =
			mobileNavbar?.containerEl?.querySelector<HTMLElement>(
				".mobile-navbar-actions",
			) ?? null;
		if (fromApp) {
			return fromApp;
		}
		return document.querySelector<HTMLElement>(
			".mobile-navbar .mobile-navbar-actions",
		);
	}

	private refreshNavbarButton() {
		const actions = this.getNavbarActions();
		if (!actions) {
			return;
		}

		const existing = actions.querySelector<HTMLElement>(
			`.${NAVBAR_BUTTON_CLASS}`,
		);

		if (!this.settings.addNavbarButton) {
			existing?.detach();
			this.navbarButtonEl = null;
			return;
		}

		if (existing) {
			this.navbarButtonEl = existing;
			return;
		}

		const button = actions.createDiv(
			`mobile-navbar-action ${NAVBAR_BUTTON_CLASS} tappable`,
		);
		button.setAttribute("aria-label", "Vollbild umschalten");
		const icon = button.createSpan("clickable-icon");
		setIcon(icon, "maximize");
		this.registerDomEvent(button, "click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			this.toggleFullscreen();
		});

		const menuButton = actions.querySelector(".mobile-navbar-action-menu");
		actions.insertBefore(button, menuButton);
		this.navbarButtonEl = button;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.applySettings();
	}
}

class MobileSidebarFullscreenSettingTab extends PluginSettingTab {
	plugin: MobileSidebarFullscreenPlugin;

	constructor(app: App, plugin: MobileSidebarFullscreenPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Mobile Sidebar Fullscreen" });

		new Setting(containerEl)
			.setName("Seitenleiste in voller Breite")
			.setDesc(
				"Öffnet die mobile Seitenleiste über die volle Bildschirmbreite statt nur 84 %.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.fullWidthSidebar)
					.onChange(async (value) => {
						this.plugin.settings.fullWidthSidebar = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Breite der Seitenleiste")
			.setDesc("Breite der geöffneten Seitenleiste in Prozent des Bildschirms.")
			.addSlider((slider) =>
				slider
					.setLimits(50, 100, 5)
					.setValue(this.plugin.settings.sidebarWidthPercent)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.sidebarWidthPercent = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Ausgeblendete Leisten: Platz nutzen")
			.setDesc(
				'Bei "Einstellungen -> Darstellung -> Vollbild" blendet Obsidian die Leisten automatisch aus. Diese Option lässt die Notiz den freien Platz einnehmen.',
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.reclaimSpaceOnAutoHide)
					.onChange(async (value) => {
						this.plugin.settings.reclaimSpaceOnAutoHide = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Vollbild-Symbol in der Navigationsleiste")
			.setDesc(
				"Fügt unten in der mobilen Navigationsleiste einen Button zum Umschalten des Vollbilds hinzu.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.addNavbarButton)
					.onChange(async (value) => {
						this.plugin.settings.addNavbarButton = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Werkzeugleiste im Vollbild ausblenden")
			.setDesc(
				"Blendet zusätzlich die Formatierungs-Werkzeugleiste aus. Beim Bearbeiten mit Tastatur ist es meist besser, sie sichtbar zu lassen.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.hideToolbarInFullscreen)
					.onChange(async (value) => {
						this.plugin.settings.hideToolbarInFullscreen = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
