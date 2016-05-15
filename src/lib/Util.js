'usr strict';

const Promise = require('bluebird');
const R = require('ramda');

// class Markdown {
//   constructor(){
    
//   }
// }

module.exports = {
  Markdown: {
    bold: text => `**${text}**`,
    italic: text => `*${text}*`,
    underline: text => `__${text}__`,
    strikeout: text => `~~${text}~~`,
    inline: text => `\`${text}\``,
    code: (text, syntax) => `\`\`\`${syntax || ''}\n${text}\n\`\`\``,
  }
}