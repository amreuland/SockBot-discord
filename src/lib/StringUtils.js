'usr strict'

module.exports = {
  Markdown: {
    bold: text => `**${text}**`,
    italic: text => `*${text}*`,
    underline: text => `__${text}__`,
    strikeout: text => `~~${text}~~`,
    inline: text => `\`${text}\``,
    boldInline: text => `**\`${text}\`**`,
    code: (text, syntax) => `\`\`\`${syntax || ''}\n${text}\n\`\`\``
  },

  SplitString: str => str.trim().split(/ +/),
  toTitleCase: str => {
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    })
  }
}
