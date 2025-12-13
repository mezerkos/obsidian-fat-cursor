import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

function waitForReflowComplete() {
	return new Promise((res) => {
		window.requestAnimationFrame(() => res(true));
	})
}

class FatCursorForWindow {
	app: App;
	cursorElement: HTMLSpanElement;
	bufferedDocument: Document;
	bufferedWindow: Window;
	lastPos: DOMRect | null = null;
	plugin: FatCursorPlugin;
	wrapperElement: HTMLDivElement | null;
	constructor(plugin: FatCursorPlugin, aw: Window, ad: Document, registerDomEvent: CallableFunction, show: boolean = true) {
		this.plugin = plugin;
		this.app = plugin.app;
		// buffering
		this.bufferedWindow = aw;
		this.bufferedDocument = ad;
		this.wrapperElement = ad.createElement("div");
		this.wrapperElement.addClass("cursorWrapper");
		this.cursorElement = ad.createElement("span");
		this.wrapperElement.appendChild(this.cursorElement);
		ad.body.appendChild(this.wrapperElement);
		this.cursorElement.addClass("x-cursor");
		const styleRoot = this.wrapperElement;
		let datumTop = 0;
		let datumElement: HTMLElement;
		let cursorVisibility = false;
		let processing = false;
		const moveCursor = async (e?: Event, noAnimate?: boolean) => {
			if (processing) {
				return;
			}
			processing = true;
			await __moveCursor(e, noAnimate);
			processing = false;
		}
		const __moveCursor = async (e?: Event, noAnimate?: boolean) => {
			console.log("MoveEvent" +e);
			try {
				if (e && e.target instanceof HTMLElement && (e.target.isContentEditable || e.target.tagName == "INPUT")) {
					// If it caused by clicking an element and it is editable.
					datumElement = e.target;
					if (!cursorVisibility) {
						cursorVisibility = true;
					}
				} else if (e != null) {
					// If it caused by clicking an element but it is not editable.
					if (cursorVisibility) {
						styleRoot.style.setProperty("--cursor-visibility", `hidden`);
						cursorVisibility = false;
					}
					return;
				}
				if (e && e.target instanceof HTMLElement) {
					// Memo datum element for scroll.
					datumElement = e.target;
				}
				await waitForReflowComplete();
				datumTop = datumElement.getBoundingClientRect().top;
				let targetElement = (e?.target as HTMLElement);

				var rect = null;
				var lh = 18;

				const selection = aw.getSelection();
				if (selection && selection.getRangeAt(0) && selection.getRangeAt(0).getClientRects()[0]) { // && selection.getRangeAt(0).cloneContents().querySelectorAll("*").length) {
					console.log("Use selection");
					rect = selection.getRangeAt(0).getClientRects()[0];
					lh = parseInt(targetElement.getCssPropertyValue("line-height")) ?? 18;

				} else if (targetElement.querySelector(".cm-active")?.getClientRects() ? [0] : null) {
					rect = targetElement.querySelector(".cm-active")?.getClientRects()[0] ?? null;
					lh = parseInt(targetElement.querySelector(".cm-active")?.getCssPropertyValue("line-height") ?? "18");
				} else if (targetElement.getClientRects()[0]) {
					rect = targetElement.getClientRects()[0];
					lh = parseInt(targetElement.getCssPropertyValue("line-height")) ?? 18;
				}
lh = Math.max(parseInt(targetElement.querySelector(".cm-active")?.getCssPropertyValue("line-height") ?? "18"), parseInt(targetElement.getCssPropertyValue("line-height")) ?? 18);
				// const selection = aw.getSelection();
				// if (!selection) {
				// 	console.log("Could not find selection");
				// 	return;
				// }
				// if (selection.rangeCount == 0) return;
				// const range = selection.getRangeAt(0);
				// var rect: DOMRect | null = range?.getClientRects()[0];
				// if (!rect) {
				// 	console.log("No Rect, trying targetElement");
				// 	if (targetElement.querySelector(".cm-active")?.getClientRects() ? [0] : null) {
				// 		rect = targetElement.querySelector(".cm-active")?.getClientRects()[0] ?? null;
				// 	} else if (targetElement.getClientRects()[0]) {
				// 		rect = targetElement.getClientRects()[0];
				// 	}

					if (rect == null) {
						[]
						console.log("No Rect");


						return;
					}


				// }
				if (this.lastPos == null) {
					this.lastPos = rect;
				} else if (this.lastPos.x == rect.x && this.lastPos.y == rect.y) {
					// return;
				}
				console.log("lh", lh);
				//Set properties at once.
				styleRoot.style.cssText = `
  --cursor-x1: ${rect.x}px;
  --cursor-y1src: ${rect.y}px;
  --cursor-x2: ${rect.x}px;
  --cursor-y2src: ${rect.y}px;
  --cursor-offset-y: ${0}px;
  	--cursor-height: ${lh}px;

  --cursor-visibility: visible;
`;
				if (noAnimate) {
					this.lastPos = rect;
					return;
				}
				aw.requestAnimationFrame((time) => {
					this.cursorElement.className = `x-cursor`
					this.lastPos = rect;
				});
			} catch (ex) {
				console.log(ex);
				//NO OP.
			}
		};


		const supportVIMMode = true;
		// const eventNames = ["keydown", "mousedown", "touchend", "keyup", "mouseup", "touchstart"];
				const eventNames = ["keydown", "mouseup"];

		for (const event of eventNames) {
			registerDomEvent(aw, event, (ev: Event) => {
				moveCursor(ev);
			});
		}
		let triggered = false;
		// Handles scroll till scroll is finish.
		const applyWheelScroll = (last?: number | boolean) => {
			if (!triggered) {
				requestAnimationFrame(() => {
					if (datumElement) {
						try {
							const curTop = datumElement.getBoundingClientRect().top;
							const diff = curTop - datumTop;
							styleRoot.style.setProperty("--cursor-offset-y", `${diff}px`);
							if (last === false || last != diff) {
								requestAnimationFrame(() => applyWheelScroll(diff));
							} else if (last == diff) {
								moveCursor(undefined, true);
							}
						} catch (ex) {
							// NO OP.
							console.log(ex);
						}
					}
					triggered = false;
				});
				triggered = true;
			}
		}
		registerDomEvent(aw, "wheel", (e: WheelEvent) => {
			applyWheelScroll(false);
		});
	}

	unload() {
		if (this.wrapperElement) {
			const doc = this.wrapperElement.doc;
			if (doc) {
				doc.body.removeChild(this.wrapperElement);
				this.wrapperElement = null;
			}
		}
	}

}


export default class FatCursorPlugin extends Plugin {

	Cursors: FatCursorForWindow[] = [];
	settings: FatCursorPluginSettings;

	async onload() {
		await this.loadSettings();
		this.registerEvent(this.app.workspace.on("window-open", (win) => {
			console.log("Open by window-open")
			const exist = this.Cursors.find(e => e.bufferedWindow == win.win);
			if (!exist) {
				const w = new FatCursorForWindow(this, win.win, win.doc, this.registerDomEvent.bind(this));
				this.Cursors.push(w);
			}
		}));
		this.registerEvent(this.app.workspace.on("window-close", (win) => {
			const target = this.Cursors.find(e => e.bufferedWindow == win.win);
			if (target) {
				target.unload();
				this.Cursors.remove(target);
			}
		}));



		console.log("Open by init")
		const w = new FatCursorForWindow(this, window, document, this.registerDomEvent.bind(this));
		this.Cursors.push(w);


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		for (const v of this.Cursors) {
			v.unload();
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}




class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: FatCursorPlugin;

	constructor(app: App, plugin: FatCursorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}

// Remember to rename these classes and interfaces!

interface FatCursorPluginSettings {
	mySetting: string,
	reactToContentEditable: boolean,
	reactToVimMode: boolean,
	reactToInputElement: boolean;
}

const DEFAULT_SETTINGS: FatCursorPluginSettings = {
	mySetting: 'default',
	reactToContentEditable: false,
	reactToVimMode: false,
	reactToInputElement: false,
}
