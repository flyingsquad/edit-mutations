export class EditMutation {
	
	item = null;
	dlg = null;
	static dialogs = {};

	constructor(object) {
		this.item = object;
	}

	async dialog() {
		let content = "";
		
		let i = 0;
		for (let g of this.item.system.grants) {
			let mutation = "";
			if (g.mutation)
				mutation = JSON.stringify(g.mutation, null, 4);
			let lines = 1;
			for (let j = 0; j < mutation.length; j++)
				if (mutation[j] == '\n')
					lines++;
			content += `<p style="padding: 0px; margin: 0px;">${g.name}<br><textarea id="g${i}" cols="60" rows="${lines<3?3:lines}">${mutation}</textarea></p>\n`;
			i++;
		}
		content = `<div style="display: flex; flex-flow: column; overflow: scroll; height: 400px">` + content + `</div>`;

		try {
			this.dlg = await new foundry.applications.api.DialogV2({
			  window: {
				title: `Edit Mutations for ${this.item.name}`,
				resizable: true
			  },
			  content: content,
			  buttons: [
				{
					action: "ok",
					label: "OK",
					default: true,
					callback: async (event, button, dialog) => {
						let doc = document;
						let i = 1;
						let grants = [];
						for (let i = 0; i < this.item.system.grants.length; i++) {
							const mut = button.form.elements[`g${i}`].value;
							let mutation;
							if (mut) {
								try {
									mutation = JSON.parse(mut);
								} catch (err) {
									const proceed = await foundry.applications.api.DialogV2.confirm({
									  window: { title: "Error" },
									  content: `Error in mutation for ${g.name}<br>${err}`,
									  rejectClose: true,
									  modal: true
									});
									return false;
								}
							} else
								mutation = null;
							let g = this.item.system.grants[i];
							g.mutation = mutation;
							grants.push(g);
						}
						this.item.update({"system.grants": grants});
						return true;
					}
				},
				{
					action: "cancel",
					label: "Cancel"
				}
			  ],
			  submit: result => {
				EditMutation.dialogs[this.item._id] = null;
			  },
			  onClose: () => {
				EditMutation.dialogs[this.item._id] = null;
			  },
			  render: (event, dialog) => {
				  let x = 1;
				  x++;
			  }
			}).render({ force: true });
		} catch (msg) {
			ui.notifications.notify(msg);
			EditMutation.dialogs[this.item._id] = null;
		} finally {
		}
		EditMutation.dialogs[this.item._id] = this.dlg;
	}
}


Hooks.on("getItemSheetHeaderButtons", (sheet, buttonArray) => {
	if (game.user.isGM) {
		if (!sheet.object.system.grants || sheet.object.system.grants.length == 0)
			return;

		let button = {
			label: "Mutations",
			class: 'edit-mutations',
			icon: 'fas fa-recycle',
			onclick: () => {
				let dlg = EditMutation.dialogs[sheet.object._id];
				if (dlg) {
					dlg.bringToFront();
					return;
				}
				let em = new EditMutation(sheet.object);
				if (em)
					em.dialog();
			}
		}
		buttonArray.unshift(button);
	}
});

