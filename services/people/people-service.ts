import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { PeopleInsights, PersonProfile } from '@/types/people'
import { buildPeopleProfiles } from './people-engine'
import { peopleConfig } from '@/config/people'

export function createPeopleService(db: SupabaseClient<Database>) {
  return {
    async getProfiles(
      workspaceId: string,
      organizationId: string,
      userEmail: string | null
    ): Promise<PersonProfile[]> {
      return buildPeopleProfiles(db, workspaceId, organizationId, userEmail)
    },

    async getInsights(
      workspaceId: string,
      organizationId: string,
      userEmail: string | null
    ): Promise<PeopleInsights> {
      const profiles = await buildPeopleProfiles(db, workspaceId, organizationId, userEmail)
      const N = peopleConfig.maxPeoplePerCategory

      const byStrengthDesc = [...profiles].sort(
        (a, b) => b.relationshipStrength - a.relationshipStrength
      )

      const champions = profiles.filter((p) => p.isChampion).slice(0, N)
      const decisionMakers = profiles.filter((p) => p.isDecisionMaker).slice(0, N)
      const staleRelationships = profiles.filter((p) => p.isStale).slice(0, N)
      const newRelationships = profiles.filter((p) => p.isNewRelationship).slice(0, N)
      const awaitingReply = profiles.filter((p) => p.awaitingReply).slice(0, N)
      const needingFollowUp = profiles.filter((p) => p.followUpRequired).slice(0, N)

      const topRelationships = byStrengthDesc
        .filter((p) => p.emailCount >= peopleConfig.minEmailsForTopRelationship)
        .slice(0, N)

      const sourceCounts = profiles.reduce(
        (acc, p) => {
          if (p.sources.includes('crm')) acc.crm++
          if (p.sources.includes('gmail')) acc.gmail++
          if (p.sources.includes('calendar')) acc.calendar++
          return acc
        },
        { crm: 0, gmail: 0, calendar: 0 }
      )

      return {
        totalProfiles: profiles.length,
        champions,
        decisionMakers,
        topRelationships,
        staleRelationships,
        newRelationships,
        awaitingReply,
        needingFollowUp,
        sourceCounts,
      }
    },
  }
}

export type PeopleService = ReturnType<typeof createPeopleService>
