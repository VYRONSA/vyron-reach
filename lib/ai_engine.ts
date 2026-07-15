export const generateOutreachDraft = (contactName: string, companyName: string, status: string) => {
  const drafts: { [key: string]: string } = {
    'New': `Hi ${contactName}, I noticed your interest in VYRON's growth solutions for ${companyName}. Would you be open to a 10-minute brief on how we're scaling similar operations?`,
    'Discovery': `Hi ${contactName}, it was great connecting regarding ${companyName}. I've drafted a preliminary strategy based on our last talk. Ready to review?`,
    'Proposal': `Hi ${contactName}, I'm following up on the proposal for ${companyName}. We have a small window to lock in the current resource allocation for next month.`,
    'High Value': `Good day ${contactName}, given the scale of the ${companyName} project, I've looped in our senior strategy team. Let's finalize the roadmap.`
  };

  return drafts[status] || drafts['New'];
};