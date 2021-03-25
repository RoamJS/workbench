{
	console.log('user Commands loading')

	roam42.wB.userCommands = {};

	roam42.wB.userCommands.intialize = async()=>{
		roam42.wB.userCommands.currentUser = (await roam42.common.userInformation()).email;
	}; //END of roam42.wB.userCommands.intialize

	const runInboxCommand = async (cmdInfo)=>{
		console.log('runInboxCommand', cmdInfo)
	}

	roam42.wB.userCommands.runComand = async (cmdInfo)=>{
		//this function is called by the workBench to peform an action
		
		switch(cmdInfo['type']) {
			case 'inbox':
				await runInboxCommand();
				break;
		}		
	};

	roam42.wB.userCommands.findBlockAmongstChildren = async ( childrenBlocks, startsWith )=> {
		//loops through array and returns node where the text matches
		for(c of childrenBlocks) {
			if(c.string.toLowerCase().startsWith(startsWith))
				return c.string;
		}
		return null;
	};

	roam42.wB.userCommands.UserDefinedCommandList = async ()=>{
		let validCommandTypeList = ['inbox']; //in future add new types here
		let userCommands = await roam42.common.getBlocksReferringToThisPage("42workBench");
		let results = [];
		for (item of userCommands) {
			const inbox = item[0];
			//		 	console.log( JSON.stringify(inbox,0,2) );
			var sType = inbox.string.replace('#42workBench','').replace('#[[42workBench]]','').trim().toLowerCase();
			if( inbox.children && validCommandTypeList.includes(sType) ) {
				//if contains users, check if this user command should run. if no user defined, command continues to process
				let users = await roam42.wB.userCommands.findBlockAmongstChildren( inbox.children, 'users:' );
				if(users!=null && users.trim() !='users:') {
					const userArray = users.replace('users:','').trim().split(' ');
					if(userArray.includes( roam42.wB.userCommands.currentUser )==false) continue;
				}
				//must contain a name
				let name = await roam42.wB.userCommands.findBlockAmongstChildren( inbox.children, 'name:' );
				if(name==null)  continue;
				name = name.substring(5).trim();
				results.push( {
					key: name,
					'type': sType,
					'details': item
				});
			}
		}
		return roam42.common.sortObjectByKey(results);
	};	

	roam42.wB.userCommands.intialize();
};