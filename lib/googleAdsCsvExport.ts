import type { GoogleAdsPlanSections } from '@/lib/googleAdsPlanGenerator'
import type { GoogleAdsBuilderPrefill } from '@/lib/executionPrefill'

/** Export-ready CSV for manual import / reference in Google Ads Editor workflows. */
export function exportGoogleAdsCsv(form: GoogleAdsBuilderPrefill, sections: GoogleAdsPlanSections): string {
  const rows: string[][] = [
    ['Type', 'Campaign', 'Ad group', 'Keyword', 'Match type', 'Headline', 'Description', 'Daily budget', 'Location', 'Negative keyword'],
    [
      'Campaign',
      form.campaignName,
      '',
      '',
      'Search',
      '',
      '',
      String(form.dailyBudget),
      form.targetArea,
      '',
    ],
  ]

  sections.exactKeywords.split('\n').filter(Boolean).forEach(line => {
    const kw = line.replace(/^\[|\]$/g, '').trim()
    if (!kw) return
    rows.push(['Keyword', form.campaignName, 'Exact Buyer Intent', kw, 'Exact', '', '', '', '', ''])
  })

  sections.phraseKeywords.split('\n').filter(Boolean).forEach(line => {
    const kw = line.replace(/^"|"$/g, '').trim()
    if (!kw) return
    rows.push(['Keyword', form.campaignName, 'Phrase Commercial', kw, 'Phrase', '', '', '', '', ''])
  })

  sections.negativeKeywords.split('\n').filter(Boolean).forEach(neg => {
    rows.push(['Negative', form.campaignName, '', '', '', '', '', '', '', neg.trim()])
  })

  sections.headlines.split('\n').filter(Boolean).forEach((h, i) => {
    const text = h.replace(/^\d+\.\s*/, '').trim()
    rows.push(['Headline', form.campaignName, 'RSA', '', '', text, '', '', '', ''])
  })

  sections.descriptions.split('\n').filter(Boolean).forEach(d => {
    const text = d.replace(/^\d+\.\s*/, '').trim()
    rows.push(['Description', form.campaignName, 'RSA', '', '', '', text, '', '', ''])
  })

  return rows
    .map(cols =>
      cols
        .map(c => {
          const s = String(c)
          return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
        })
        .join(','),
    )
    .join('\n')
}
