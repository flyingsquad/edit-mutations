export class EditMutation {
	
	item = null;
	dlg = null;

	constructor(item) {
		this.item = item;
	}

	async dialog() {
		let content = "";
		
		if (this.item.system.grants && this.item.system.grants.length > 0) {
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
		} else {
			content = `<p>${this.item.name} contains no grants.</p>`;
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
						if (!this.item.system.grants || this.item.system.grants.length == 0)
							return true;
						let doc = document;
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
			  },
			  onClose: () => {
			  },
			  onRender: (event, dialog) => {
				  let x = 1;
				  x++;
			  }
			}).render({ force: true });
		} catch (msg) {
			ui.notifications.notify(msg);
		}
	}
}


Hooks.on("getHeaderControlsApplicationV2", (sheet, buttonArray) => {
	if (game.user.isGM) {
		let button = {
			label: "Mutations",
			class: 'edit-mutations',
			icon: 'fas fa-recycle',
			onClick: () => {
				let em = new EditMutation(sheet.item);
				if (em)
					em.dialog();
			}
		}
		buttonArray.unshift(button);
	}
});

