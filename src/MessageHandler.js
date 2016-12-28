const Util = require('./Util.js');

class MessageHandler {
  constructor(bot) {
    this.bot = bot;
  }

  handle(message) {
    if (message.content === '!commands') {
      message.author.sendMessage(Util.commandsList());
    } else if (message.content === '!mostplayed') {
      message.channel.sendMessage(Util.mostPlayedList());
    } else if (message.content === '!add' && message.attachments.length > 0) {
      Util.addSounds(message.attachments, message.channel);
    } else if (message.content.startsWith('!remove ')) {
      const sound = message.content.replace('!remove ', '');
      Util.removeSound(sound, message.channel);
    } else if (message.content.startsWith('!rename ')) {
      const [oldsound, newsound] = message.content.replace('!rename ', '').split(' ');
      Util.renameSound(oldsound, newsound, message.channel);
    } else {
      const sounds = Util.getSounds();
      if (message.content === '!sounds') {
        message.author.sendMessage(sounds.map(sound => sound));
      } else {
        const voiceChannel = message.author.voiceChannel;
        if (voiceChannel === null) {
          message.reply('Join a voice channel first!');
        } else if (message.content === '!stop') {
          voiceChannel.leave();
          this.bot.queue = [];
        } else if (message.content === '!random') {
          const random = sounds[Math.floor(Math.random() * sounds.length)];
          this.bot.addToQueue(voiceChannel, random);
        } else {
          const sound = message.content.split('!')[1];
          if (sounds.includes(sound)) {
            this.bot.addToQueue(voiceChannel, sound);
            if (this.bot.voiceConnection === undefined) this.bot.playSoundQueue();
          }
        }
      }
    }
  }
}

module.exports = MessageHandler;
