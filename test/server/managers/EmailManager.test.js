const { expect } = require('chai')
const Database = require('../../../server/Database')
const EmailManager = require('../../../server/managers/EmailManager')
const EmailSettings = require('../../../server/objects/settings/EmailSettings')

describe('Email attachment filenames', () => {
  const manager = new EmailManager()
  const ebook = { metadata: { filename: 'original.epub', path: '/books/original.epub' } }
  let previousSettings

  beforeEach(() => {
    previousSettings = Database.emailSettings
    Database.emailSettings = new EmailSettings()
  })

  afterEach(() => {
    Database.emailSettings = previousSettings
  })

  it('defaults to the original filename and persists the opt-in setting', () => {
    expect(manager.getAttachmentFilename(ebook, { title: 'Title', series: [{ name: 'Series' }] })).to.equal('original.epub')
    Database.emailSettings.update({ includeSeriesInFilename: true })
    const restored = new EmailSettings(Database.emailSettings.toJSON())
    expect(restored.includeSeriesInFilename).to.equal(true)
    restored.update({ includeSeriesInFilename: false })
    expect(restored.includeSeriesInFilename).to.equal(false)
  })

  it('uses the first series and preserves fractional and zero positions', () => {
    Database.emailSettings.includeSeriesInFilename = true
    for (const sequence of ['2.5', 0]) {
      const book = { title: 'Title', series: [{ name: 'Series', bookSeries: { sequence } }, { name: 'Other' }] }
      expect(manager.getAttachmentFilename(ebook, book)).to.equal(`Series [${sequence}] - Title.epub`)
    }
  })

  it('omits missing positions and falls back for books without a series', () => {
    Database.emailSettings.includeSeriesInFilename = true
    expect(manager.getAttachmentFilename(ebook, { title: 'Title', series: [{ name: 'Series' }] })).to.equal('Series - Title.epub')
    expect(manager.getAttachmentFilename(ebook, { title: 'Title', series: [] })).to.equal('original.epub')
    expect(manager.getAttachmentFilename(ebook)).to.equal('original.epub')
  })

  it('sanitizes metadata and preserves the original extension and source path', () => {
    Database.emailSettings.includeSeriesInFilename = true
    const filename = manager.getAttachmentFilename(ebook, { title: 'A/B?', series: [{ name: 'Series' }] })
    expect(filename).to.equal('Series - AB.epub')
    expect(ebook.metadata.path).to.equal('/books/original.epub')
    expect(ebook.metadata.filename).to.equal('original.epub')
  })
})
