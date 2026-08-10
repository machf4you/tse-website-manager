import fs from 'fs'

// Let's fetch the live package or simulate stored package structure
import { generateContextualReplacement } from '../src/utils/internalLinkingHelper.js'

// Test with exact text from live Ascent Builders site
const mockAscentPage = {
  url: 'https://ascentbuilders.co.uk/loft-conversions-walton-on-thames/',
  title: 'Loft Conversions Walton-On-Thames',
  crawlData: {
    plainText: '07742 728720 Construction Work You Can Count On Call Us Any Time! Loft Conversions Walton-On-Thames. Adding a loft conversion to your property in Walton-On-Thames creates extra bedrooms, bathrooms, or home office space while increasing property value.'
  }
}

console.log('Testing live Ascent Builders mock page plainText:')
console.log('Raw plainText:', mockAscentPage.crawlData.plainText)

const result = generateContextualReplacement(mockAscentPage, 'loft conversions banstead')
console.log('\n--- RESULT ---')
console.log('CURRENT SOURCE TEXT:\n', result.currentSourceText)
console.log('SUGGESTED REPLACEMENT:\n', result.suggestedReplacement)
