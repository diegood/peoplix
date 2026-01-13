import { describe, it, expect } from 'vitest'
import { getAcronym } from '../StringHelper'

describe('StringHelper', () => {
  describe('getAcronym', () => {
    it('should return 3 letters for single word', () => {
      expect(getAcronym('Workload')).toBe('WOR')
      expect(getAcronym('Single')).toBe('SIN')
    })

    it('should return acronym for multiple words', () => {
        expect(getAcronym('Workload Management System')).toBe('WMS')
        expect(getAcronym('My Cool Org')).toBe('MCO')
    })
    
    it('should handle special chars', () => {
        expect(getAcronym('Workload-Management')).toBe('WOR') // Default split is space. If special chars removed differently...
        // Original logic removes special chars then splits by space.
        // removeSpecialChars('Workload-Management') -> 'WorkloadManagement' -> 1 word -> 'WOR'
        // Ideally 'Workload-Management' might be wanted as WM? 
        // User example was "Workload" -> "WOR". 
        // Current impl: removeSpecialChars replaces `[^a-zA-Z ]` with ''.
        // So 'Workload-Management' -> 'WorkloadManagement'.
        // This seems consistent with current implementation.
    })
  })
})
