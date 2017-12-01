const Discord = require('discord.js');
const fs = require('fs');

const client = new Discord.Client();
const modRole = 'Admin';
const modRole2 = 'Owner';

const items = JSON.parse(fs.readFileSync('./Storage/items.json', 'utf8'));
const inventory = JSON.parse(fs.readFileSync('./Storage/inventory.json', 'utf8'));
const bank = JSON.parse(fs.readFileSync('./Storage/bank.json', 'utf8'));

client.on('message', message => {

    //Variables
    let prefix = '*';
    let sender = message.author;
    let msg = message.content.toUpperCase();
    let cont = message.content.slice(prefix.length).split(" ");
    let args = cont.slice(1);


    if (msg === `${prefix}PING`) {
        message.channel.send('Pong!');
    }

    if(msg.startsWith(`${prefix}SET`)) {
        if(!message.member.roles.find("name", modRole)){
            message.channel.send(`**You need the ` + modRole + ` role to use this command**`);
            return;
        }
        if(!args[0]) {
            message.channel.send(`**You need to define an amount. Usage: ${prefix}set <amount> <user>**`);
            return;
        }

        if(isNaN(args[0])){
            message.channel.send(`**The amount has to be a number. Usage: ${prefix}set <amount> <user>**`);
            return;
        }

        if(args[0] > 1000){
            if(!message.member.roles.find("name", modRole2)){
            message.channel.send(`**The amount has to be lower than 1000**`);
            return;
            }
        }

        var defineduser = '';
        var definedusername = '';
        if(!args[1]) {
            defineduser = sender.id;
            definedusername = message.author.username;
        } else {
            let firstMentioned = message.mentions.users.first();
            defineduser = firstMentioned.id;
            definedusername = firstMentioned.username;
        }


        if(!bank[defineduser + message.guild.id]){
            bank[defineduser + message.guild.id] = {}
            bank[defineduser + message.guild.id].money = 0
            bank[defineduser + message.guild.id].username = definedusername
        }
        bank[defineduser + message.guild.id].money += parseInt(args[0])
        message.channel.send(`<@` + defineduser + `>` + `** got ${args[0]}!**`)

        fs.writeFile('./Storage/bank.json', JSON.stringify(bank), (err) => {
            if(err) console.error(err);
        });
    }

    if(msg.startsWith(`${prefix}BALANCE`)) {

        let newuser = '';
        if(!args[0]) {
            newuser = sender.id;
        } else {
            if(!message.member.roles.find("name", modRole)){
                message.channel.send(`**You can only check your own balance**`);
                return;
            }
            let first = message.mentions.users.first();
            newuser = first.id;

        }
        if(!bank[newuser + message.guild.id]){
            message.channel.send(`**You have no money bruh**`);
            return;
        }
            const embed = new Discord.RichEmbed()
            .setDescription(`**Bank of ${message.guild.name}`)
            .setColor(0xD4AF37)
            .addField('Account Holder',  `<@${newuser}>`, true)
            .addField(`Account Balance`, bank[newuser + message.guild.id].money, true);

            message.channel.send({embed})
    }
    
    if(msg.startsWith(`${prefix}BOARD`) || msg.startsWith(`${prefix}LEADERBOARD`)){
        var guildMoney = 0;
        var guildUsers = 0;
        var sortable = [];
        
    if(Object.keys(bank).length === 0 && bank.constructor === Object){
        return message.channel.send(`**Your server has no leaderboard. Go give your subjects some money!**`);
    }
        for(var i in bank) {
            if(i.endsWith(message.guild.id)) {
                sortable.push([bank[i].money, bank[i].username]);
                guildMoney += bank[i].money;
                guildUsers += 1;
            }
        }

        function Comparator(a, b) {
            if(a[0] < b[0]) return 1;
            if(a[0] > b[0]) return -1;
            return 0;
        }
        ranked = sortable.sort(Comparator);
        var top3 = ranked.slice(0, 3);

        const embed = new Discord.RichEmbed()
        .setTitle(`**${message.guild.name}'s LeaderBoard**`)
        .setColor(0xF1C40F)
        .addField('Total Server Money', guildMoney, true)
        .setDescription('Leaderboard', false)
        .addField('1. ' + top3[0][1],top3[0][0], false)
        .addField('2. ' + top3[1][1],top3[1][0], false)
        .addField('3. ' + top3[2][1],top3[2][0], false)
      
        message.channel.send({embed});

    }

    if(msg.startsWith(`${prefix}BUY`)){
        let categories = [];

        //Show the storefront
        if(!args.join(" ")) {
            for (var i in items) {
                if(!categories.includes(items[i].type)){
                    categories.push(items[i].type)
                }
            }

            const embed = new Discord.RichEmbed()
            .setDescription(`Items for sale`)
            .setColor(0xD4AF37)
            for (var i = 0; i < categories.length; i++){
                var tempDesc = '';
                for (var c in items) {
                    if(categories[i] === items[c].type) {
                        tempDesc += `${items[c].name} - $${items[c].price} - ${items[c].desc}\n`;
                    }
                }
                embed.addField(categories[i], tempDesc);
            }
            return message.channel.send({embed});
        }
        //Buy the items

        let itemName = '';
        let itemPrice = 0;
        let itemDesc = '';

        for(var i in items) {
            if (args.join(" ").trim().toUpperCase() === items[i].name.toUpperCase()) {
                itemName = items[i].name;
                itemPrice = items[i].price;
                itemDesc = items[i].desc;
            }
        }

        //If the item wasn't found
        if(itemName === '') {
            return message.channel.send(`**We don't have this item in stock**`);
        }

        if(!bank[sender.id + message.guild.id]){
            return message.channel.send(`**You do not have sufficient funds to purchase this item**`);
        }

        if(bank[sender.id + message.guild.id].money < itemPrice){
            return message.channel.send(`**You do not have sufficient funds to purchase this item**`)
        }

        bank[sender.id + message.guild.id].money -= parseInt(`${itemPrice}`);

        message.channel.send('**' + itemName + ' has been added to your inventory. Your new balance is: $' + bank[sender.id + message.guild.id].money + '**');

        if(itemName != ''){
            if(!inventory[sender.id + message.guild.id]){
                inventory[sender.id + message.guild.id] = {}
            }
            if(!inventory[sender.id + message.guild.id][itemName]){
                inventory[sender.id + message.guild.id][itemName] = 0;
            }
            inventory[sender.id + message.guild.id][itemName] ++;

            fs.writeFile('./Storage/inventory.json', JSON.stringify(inventory), (err) => {
                if(err) console.error(err);
            });
            fs.writeFile('./Storage/bank.json', JSON.stringify(bank), (err) => {
                if(err) console.error(err);
            });
        }
    }

    if(msg.startsWith(`${prefix}INVENTORY`)){
        if(!inventory[sender.id + message.guild.id]){
            return message.channel.send('**You do not have any items. Use the *buy command to purchase items.**');
        }
        const embed = new Discord.RichEmbed()
        .setDescription(`**<@${sender.id}>'s Bag**`)
        .setColor(0xF1C40F)
        .addField('Item', Object.keys(inventory[sender.id + message.guild.id]), true)
        .addField('Item', Object.values(inventory[sender.id + message.guild.id]), true);

        message.channel.send({embed});
    }


});

client.login('');