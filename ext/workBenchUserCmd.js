{
	roam42.wB.userCommands = {};

	roam42.wB.userCommands.inboxUID = async (wBInbox) =>{
		const ibx = wBInbox[0];
		let pageName = await roam42.wB.userCommands.findBlockAmongstChildren( ibx.children, 'page:' );
		if(pageName == null) { //default to DNP
			pageUID = await roam42.common.getPageUidByTitle(roam42.dateProcessing.parseTextForDates('today').replace('[[','').replace(']]','').trim());
			pageName = "Today's DNP";
		}
		else { //get page UID, if doesnt exist, exist
			pageUID = await roam42.common.getPageUidByTitle( pageName );
			if(pageUID == '') {
				roam42.help.displayMessage(`This page "${pageName}" doesnt exist, action not performed.`,5000);
				return;
			}
		}
		let textName = await roam42.wB.userCommands.findBlockAmongstChildren( ibx.children, 'text:' );
		//if text defined, get the UID of the tag.
		let textUID = textName==null ? null : (await roam42.formatConverter.flatJson(pageUID,false,false)).find(e=>e.blockText.toLowerCase().includes(textName.toLowerCase()));
		//reset pageUID if there is a valid text block
		pageUID = textUID ? textUID.uid : pageUID;

		return pageUID;
	}

	const runInboxCommand = async (cmdInfo)=>{
		let pageUID = null;
		let pageName = await roam42.wB.userCommands.findBlockAmongstChildren( cmdInfo.info[0].children, 'page:' );
		if(pageName == null) { //default to DNP
			pageUID = await roam42.common.getPageUidByTitle(roam42.dateProcessing.parseTextForDates('today').replace('[[','').replace(']]','').trim());
			pageName = "Today's DNP";
		}
		else { //get page UID, if doesnt exist, exist
			pageUID = await roam42.common.getPageUidByTitle( pageName );
			if(pageUID == '') {
				roam42.help.displayMessage(`This page "${pageName}" doesnt exist, action not performed.`,5000);
				return;
			}
		}
		let textName = await roam42.wB.userCommands.findBlockAmongstChildren( cmdInfo.info[0].children, 'text:' );
		//if text defined, get the UID of the tag.
		let textUID = textName==null ? null : (await roam42.formatConverter.flatJson(pageUID,false,false)).find(e=>e.blockText.toLowerCase().includes(textName.toLowerCase()));
		//reset pageUID if there is a valid text block
		pageUID = textUID ? textUID.uid : pageUID;

		let locationTopBotom = await roam42.wB.userCommands.findBlockAmongstChildren( cmdInfo.info[0].children, 'location:' );
		locationTopBotom = locationTopBotom=='bottom' ? 10000 : 0;

		let blockRef = await roam42.wB.userCommands.findBlockAmongstChildren( cmdInfo.info[0].children, 'blockref:' );
		if(blockRef==null)
			blockref = false;
		else
			blockRef = blockRef.toLowerCase()=='true' ? true : false;

		await roam42.wB.moveBlocks(pageUID,location,0,blockRef);
		textName = textName==null ? '' : ' > ' + textName;
		roam42.help.displayMessage(`Block(s) moved to ${pageName}${textName}`,3000);
	}

	roam42.wB.userCommands.runComand = async (cmdInfo)=>{
		//this function is called by the workBench to peform an action
		switch(cmdInfo['type']) {
			case 'inbox':
				await runInboxCommand(cmdInfo);
				break;
		}		
	};

	roam42.wB.userCommands.findBlockAmongstChildren = async ( childrenBlocks, startsWith )=> {
		//loops through array and returns node where the text matches
		for(c of childrenBlocks) {
			if(c.string.toLowerCase().startsWith(startsWith)) {
				return c.string.toLowerCase().replace(startsWith,'').trim();
			}
		}
		return null;
	};

	roam42.wB.userCommands.UserDefinedCommandList = async ()=>{
		let validCommandTypeList = ['inbox']; //in future add new types here
		let userCommands = await roam42.common.getBlocksReferringToThisPage("42workBench");
		let results = [];
		for (item of userCommands) {
			const inbox = item[0];
			var sType = inbox.string.replace('#42workBench','').replace('#[[42workBench]]','').trim().toLowerCase();
			if( inbox.children && validCommandTypeList.includes(sType) ) {
				let users = await roam42.wB.userCommands.findBlockAmongstChildren( inbox.children, 'users:' );
				if(users!=null && users.trim() !='users:') {
					const userArray = users.split(' ');
					if(userArray.includes( roam42.user.email )==false) continue;
				}				
				//must contain a name
				let name = await roam42.wB.userCommands.findBlockAmongstChildren( inbox.children, 'name:' );
				if(name==null)  continue;
				results.push( {
					key: name,
					'type': sType,
					'details': item
				});
			}
		}
		return roam42.common.sortObjectByKey(results);
	};	

};