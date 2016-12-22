const fs = require('fs');
const https = require('https');
const low = require('lowdb');
const fileAsync = require('lowdb/lib/file-async');

class Util {
  constructor() {
    this.db = low('db.json', { storage: fileAsync });
  }

  getSounds() {
    let sounds = fs.readdirSync('sounds/');
    sounds = sounds.filter(sound => sound.includes('.mp3'));
    sounds = sounds.map(sound => sound.split('.')[0]);
    return sounds;
  }

  commandsList() {
    return [
      '```',
      '!commands         Show this message',
      '!sounds           Show available sounds',
      '!mostplayed       Show 15 most used sounds',
      '!<sound>          Play the specified sound',
      '!random           Play random sound',
      '!stop             Stop playing and clear queue',
      '!add              Add the attached sound',
      '!remove <sound>   Remove specified sound',
      '```'
    ].join('\n');
  }

  mostPlayedList() {
    const sounds = this.db.get('counts').sortBy('count').reverse().take(15).value();
    const message = ['```'];

    const longestSound = this.findLongestWord(sounds.map(sound => sound.name));
    const longestCount = this.findLongestWord(sounds.map(sound => String(sound.count)));

    sounds.forEach((sound) => {
      const spacesForSound = ' '.repeat(longestSound.length - sound.name.length + 1);
      const spacesForCount = ' '.repeat(longestCount.length - String(sound.count).length);
      message.push(`${sound.name}:${spacesForSound}${spacesForCount}${sound.count}`);
    });
    message.push('```');
    return message.join('\n');
  }

  findLongestWord(array) {
    let indexOfLongestWord = 0;
    for (let i = 1; i < array.length; i++)
      if (array[indexOfLongestWord].length < array[i].length) indexOfLongestWord = i;
    return array[indexOfLongestWord];
  }

  addSounds(attachments, channel) {
    attachments.forEach(attachment => this._addSound(attachment, channel));
  }

  _addSound(attachment, channel) {
    if (attachment.size > 1000000) {
      channel.sendMessage(`${attachment.filename.split('.')[0]} added!`);
      return;
    }

    if (!attachment.filename.endsWith('.mp3')) {
      channel.sendMessage('Sound has to be mp3!');
      return;
    }

    const filename = attachment.filename.split('.')[0];
    if (this.getSounds().includes(filename)) {
      channel.sendMessage(`${filename} already exists!`);
      return;
    }

    https.get(attachment.url, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(`./sounds/${attachment.filename}`);
        response.pipe(file);
        channel.sendMessage(`${filename} added!`);
      }
    }).on('error', (error) => {
      console.error(error);
      channel.sendMessage('Something went wrong!');
    });
  }

  removeSound(sound, channel) {
    const file = `sounds/${sound}.mp3`;
    try {
      fs.unlinkSync(file);
      channel.sendMessage(`${sound} removed!`);
    } catch (error) {
      channel.sendMessage(`${sound} not found!`);
    }
  }

  updateCount(playedSound) {
    const sound = this.db.get('counts').find({ name: playedSound }).value();
    if (sound) {
      this.db.get('counts').find({ name: playedSound }).value().count =
        this.db.get('counts').find({ name: playedSound }).value().count + 1;
      this.db.write();
    } else {
      this.db.get('counts').push({ name: playedSound, count: 1 }).value();
    }
  }
}

module.exports = new Util();
