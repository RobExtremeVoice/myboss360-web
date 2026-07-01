export const peopleConfig = {
  // Days without interaction before a relationship is considered stale
  staleRelationshipDays: 30,
  // Days since first interaction to be considered a new relationship
  newRelationshipDays: 14,
  // Minimum scores to qualify as a champion
  championMinRelationshipStrength: 70,
  championMinEngagementScore: 60,
  // Keywords in job titles that signal decision-making authority
  decisionMakerTitleKeywords: [
    'ceo', 'cto', 'cfo', 'coo', 'cso', 'cmo', 'cpo',
    'president', 'founder', 'co-founder', 'owner',
    'chief', 'vp', 'vice president',
    'director', 'head of', 'head,',
    'partner', 'principal', 'managing director',
  ] as const,
  // Window for scoring interaction frequency
  scoringWindowDays: 90,
  // Max profiles returned per insight category
  maxPeoplePerCategory: 10,
  // Interactions required to appear in top relationships
  minEmailsForTopRelationship: 2,
} as const
