// index.js
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const prefix = '+';
const updateInterval = 10000; // 10 secondes
const liveMessages = new Map(); // stocke message par salon

client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    const targetChannelId = args[0];
    if (!targetChannelId) return message.reply("Veuillez fournir l'ID du salon.");

    const targetChannel = message.guild.channels.cache.get(targetChannelId);
    if (!targetChannel) return message.reply("Salon introuvable.");

    // Créer ou récupérer le message live
    let liveMessage = liveMessages.get(targetChannelId);
    if (!liveMessage) {
        liveMessage = await targetChannel.send('Chargement des statistiques...');
        liveMessages.set(targetChannelId, liveMessage);
    }

    // Fonction pour mettre à jour les stats
    const updateStats = async () => {
        if (command === 'ligne') {
            const onlineCount = message.guild.members.cache.filter(
                member => member.presence?.status === 'online'
            ).size;
            liveMessage.edit(`En ligne : ${onlineCount}`);
        } else if (command === 'vocal') {
            if (targetChannel.type !== 2) return;
            const voiceCount = targetChannel.members.size;
            liveMessage.edit(`Vocal : ${voiceCount}`);
        }
    };

    // Mise à jour immédiate
    updateStats();

    // Mettre à jour toutes les 10s (pas de duplication si déjà en cours)
    if (!liveMessages.has(`${targetChannelId}_interval`)) {
        const interval = setInterval(updateStats, updateInterval);
        liveMessages.set(`${targetChannelId}_interval`, interval);
    }
});

client.login(process.env.TOKEN);
