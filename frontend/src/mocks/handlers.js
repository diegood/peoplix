import { graphql, HttpResponse } from 'msw'

// Mock Data Storage (in-memory for now)
const roles = [
  { id: '1', name: 'Backend' },
  { id: '2', name: 'Frontend' },
  { id: '3', name: 'Tester' },
]

const collaborators = [
  { 
    id: '1', 
    name: 'Bruno', 
    contractedHours: 40,
    roles: [roles[0], roles[1]],
    skills: [{ id: 's1', name: 'React', level: 4 }],
    allocations: []
  },
  { 
    id: '2', 
    name: 'Jesus', 
    contractedHours: 20,
    roles: [roles[2]],
    skills: [{ id: 's2', name: 'Jest', level: 3 }],
    allocations: [] 
  }
]

const skills = [
  { id: 's1', name: 'React', level: 3 },
  { id: 's2', name: 'Vue', level: 3 },
  { id: 's3', name: 'JavaScript', level: 4 },
  { id: 's4', name: 'Jest', level: 3 },
];

const projects = [
    {
        id: '1',
        name: 'Proyecto prueba',
        contractedHours: 100,
        requiredRoles: [
            {
               id: 'req-1',
               role: roles[0], // Frontend
               skills: [skills[0], skills[1]], // Vue, JS
               resourceCount: 1,
               monthlyHours: 160
            }
        ],
        sprints: [],
        milestones: [], // Initialize milestones
        allocations: []
    },
    {
        id: '2',
        name: 'Proyecto 2',
        contractedHours: 100,
        requiredRoles: [],
        sprints: [],
        milestones: [], // Initialize milestones
        allocations: []
    }
]

const technologies = [
  { id: '1', name: 'React' },
  { id: '2', name: 'Vue' },
  { id: '3', name: 'Node.js' },
  { id: '4', name: 'Python' },
]

export const handlers = [
  graphql.query('GetRoles', () => {
    return HttpResponse.json({ data: { roles } })
  }),

  graphql.query('GetTechnologies', () => {
    return HttpResponse.json({ data: { technologies } })
  }),

  graphql.mutation('CreateTechnology', ({ variables }) => {
    const newTech = { id: String(technologies.length + 1), name: variables.name }
    technologies.push(newTech)
    return HttpResponse.json({ data: { createTechnology: newTech } })
  }),

  graphql.mutation('DeleteTechnology', ({ variables }) => {
    const index = technologies.findIndex(t => t.id === variables.id)
    if (index > -1) {
       technologies.splice(index, 1)
    }
    return HttpResponse.json({ data: { deleteTechnology: variables.id } })
  }),

  graphql.query('GetCollaborators', () => {
    return HttpResponse.json({
      data: {
        collaborators,
      },
    })
  }),

  graphql.query('GetProjects', () => {
    // Sanitize circular references
    const sanitizedProjects = projects.map(p => ({
        ...p,
        milestones: p.milestones?.map(m => {
            const { project, ...rest } = m
            return rest
        }),
        allocations: p.allocations?.map(a => {
            const { project, ...rest } = a
             // Also sanitise collaborator to avoid deep circles if needed, 
             // but usually collaborator -> allocations -> project is the circle.
             // We just need to ensure we don't return 'project' inside allocation here.
             // And if collaborator has allocations that point to projects...
             // Let's safe-guard collaborator too.
             const collabSanitized = { ...rest.collaborator }
             // Remove allocations from collaborator to be safe (client doesn't ask for them here)
             if (collabSanitized.allocations) delete collabSanitized.allocations
             
             return { ...rest, collaborator: collabSanitized }
        })
    }))
    
    return HttpResponse.json({
      data: {
        projects: sanitizedProjects,
      },
    })
  }),

  // Mutations
  graphql.mutation('CreateRole', ({ variables }) => {
    const newRole = {
      id: String(roles.length + 1),
      name: variables.name
    }
    roles.push(newRole)
    return HttpResponse.json({
      data: {
        createRole: newRole
      }
    })
  }),

  graphql.mutation('DeleteRole', ({ variables }) => {
    const index = roles.findIndex(r => r.id === variables.id)
    if (index > -1) {
      roles.splice(index, 1)
      return HttpResponse.json({ data: { deleteRole: variables.id } })
    }
    return HttpResponse.json({ errors: ['Role not found'] }, { status: 404 })
  }),

  graphql.mutation('CreateProject', ({ variables }) => {
    const newProject = {
      id: String(projects.length + 1),
      name: variables.name,
      contractedHours: variables.contractedHours,
      requiredRoles: [],
      sprints: [],
      allocations: []
    }
    projects.push(newProject)
    return HttpResponse.json({
      data: {
        createProject: newProject
      }
    })
  }),

  graphql.mutation('CreateCollaborator', ({ variables }) => {
    const newCollab = {
      id: String(collaborators.length + 1),
      name: variables.name,
      contractedHours: variables.contractedHours,
      roles: [], // For simplicity in mock, empty for now or default
      skills: [],
      allocations: []
    }
    collaborators.push(newCollab)
    return HttpResponse.json({
      data: {
        createCollaborator: newCollab
      }
    })
  }),

  graphql.mutation('CreateAllocation', ({ variables }) => {
      const { projectId, collaboratorId, roleId, percentage, startWeek } = variables
      
      const project = projects.find(p => p.id === projectId)
      const collaborator = collaborators.find(c => c.id === collaboratorId)
      const role = roles.find(r => r.id === roleId)

      if (!project || !collaborator) {
          return HttpResponse.json({ errors: ['NotFound'] }, { status: 404 })
      }
      
      const newAlloc = {
          id: 'alc-' + Math.random().toString(36).substr(2, 9),
          dedicationPercentage: percentage,
          hours: (percentage / 100) * 160,
          collaborator, 
          roles: role ? [role] : [],
          startWeek: startWeek || '2025-W01', // Default if missing (shouldn't be)
          endWeek: null
      }
      
      if (!project.allocations) project.allocations = []
      project.allocations.push(newAlloc)
      
      return HttpResponse.json({ 
          data: { 
              createAllocation: { 
                  ...newAlloc, 
                  roles: newAlloc.roles.map(r => ({ id: r.id, name: r.name })),
                  collaborator: { id: collaborator.id, name: collaborator.name }
              } 
          } 
      })
  }),

  graphql.mutation('UpdateAllocation', ({ variables }) => {
      const { allocationId, percentage, endWeek } = variables
      console.log('[MSW] UpdateAllocation requested for:', allocationId)
      
      // Search in all projects
      let targetAlloc = null
      
      for (const proj of projects) {
          console.log('[MSW] Checking project:', proj.id, 'Allocations:', proj.allocations?.map(a => a.id))
          const found = proj.allocations?.find(a => a.id === allocationId)
          if (found) {
              targetAlloc = found
              break
          }
      }
      
      if (!targetAlloc) {
          console.error('[MSW] UpdateAllocation: Allocation NOT FOUND', allocationId)
          return HttpResponse.json({ errors: ['Allocation not found'] }, { status: 404 })
      }
      
      if (percentage !== undefined) {
          targetAlloc.dedicationPercentage = percentage
          targetAlloc.hours = (percentage / 100) * 160
      }
      
      if (endWeek !== undefined) {
          targetAlloc.endWeek = endWeek
      }
      
      return HttpResponse.json({ 
          data: { 
              updateAllocation: {
                  id: targetAlloc.id,
                  dedicationPercentage: targetAlloc.dedicationPercentage,
                  endWeek: targetAlloc.endWeek
              }
          } 
      })
  }),

  graphql.mutation('DeleteAllocation', ({ variables }) => {
      const { allocationId } = variables
      
      for (const proj of projects) {
          const idx = proj.allocations?.findIndex(a => a.id === allocationId)
          if (idx !== undefined && idx > -1) {
              proj.allocations.splice(idx, 1)
              return HttpResponse.json({ data: { deleteAllocation: allocationId } })
          }
      }
       return HttpResponse.json({ errors: ['Allocation not found'] }, { status: 404 })
  }),

  graphql.mutation('AddAllocationRole', ({ variables }) => {
      const { allocationId, roleId } = variables
      
      // Find allocation
      let targetAlloc = null
      for (const proj of projects) {
          const found = proj.allocations?.find(a => a.id === allocationId)
          if (found) {
              targetAlloc = found
              break
          }
      }
      
      const role = roles.find(r => r.id === roleId)
      
      if (targetAlloc && role) {
          if (!targetAlloc.roles) targetAlloc.roles = []
          // Avoid duplicates
          if (!targetAlloc.roles.find(r => r.id === roleId)) {
               targetAlloc.roles.push(role)
          }
          return HttpResponse.json({ data: { addAllocationRole: role } })
      }
      
      return HttpResponse.json({ errors: ['NotFound'] }, { status: 404 })
  }),

  graphql.mutation('RemoveAllocationRole', ({ variables }) => {
      const { allocationId, roleId } = variables
      
      // Find allocation
      let targetAlloc = null
      for (const proj of projects) {
          const found = proj.allocations?.find(a => a.id === allocationId)
          if (found) {
              targetAlloc = found
              break
          }
      }
      
      if (targetAlloc && targetAlloc.roles) {
          targetAlloc.roles = targetAlloc.roles.filter(r => r.id !== roleId)
          return HttpResponse.json({ data: { removeAllocationRole: roleId } })
      }
      
      return HttpResponse.json({ errors: ['NotFound'] }, { status: 404 })
  }),

  graphql.mutation('CreateMilestone', ({ variables }) => {
      const { projectId, name, date, type } = variables
      const project = projects.find(p => p.id === projectId)
      if (!project) return HttpResponse.json({ errors: ['NotFound'] }, { status: 404 })
      
      if (!project.milestones) project.milestones = []
      
      const newMilestone = {
          id: 'mil-' + Math.random().toString(36).substr(2, 9),
          name,
          date,
          type,
          project
      }
      
      project.milestones.push(newMilestone)
      
      return HttpResponse.json({ 
          data: { 
              createMilestone: {
                  id: newMilestone.id,
                  name: newMilestone.name,
                  date: newMilestone.date,
                  type: newMilestone.type
                  // project is omitted to avoid circular dependency
              } 
          } 
      })
  }),
  
  graphql.mutation('DeleteMilestone', ({ variables }) => {
      const { id } = variables
      for (const proj of projects) {
        if (proj.milestones) {
            const idx = proj.milestones.findIndex(m => m.id === id)
            if (idx > -1) {
                proj.milestones.splice(idx, 1)
                return HttpResponse.json({ data: { deleteMilestone: id } })
            }
        }
      }
      return HttpResponse.json({ errors: ['NotFound'] }, { status: 404 })
  }),

  graphql.mutation('UpdateProject', ({ variables }) => {
      const { id, name, contractedHours } = variables
      const p = projects.find(p => p.id === id)
      if (p) {
          p.name = name
          p.contractedHours = contractedHours
          return HttpResponse.json({ data: { updateProject: p } })
      }
      return HttpResponse.json({ errors: ['NotFound'] }, { status: 404 })
  }),

  // NEW ROLE-BASED PROJECT REQUIREMENTS
  graphql.mutation('AddProjectRequirement', ({ variables }) => {
      const { projectId, roleId, resourceCount, monthlyHours } = variables
      const project = projects.find(p => p.id === projectId)
      const role = roles.find(r => r.id === roleId)
      
      if (project && role) {
          const newReq = {
              id: 'req-' + Math.random().toString(36).substr(2, 5),
              role,
              resourceCount: resourceCount || 1,
              monthlyHours: monthlyHours || 0,
              skills: []
          }
          if (!project.requiredRoles) project.requiredRoles = []
          project.requiredRoles.push(newReq)
          return HttpResponse.json({ data: { addProjectRequirement: newReq } })
      }
      return HttpResponse.json({ errors: ['NotFound'] }, { status: 404 })
  }),

  graphql.mutation('RemoveProjectRequirement', ({ variables }) => {
      const { projectId, requirementId } = variables
      const project = projects.find(p => p.id === projectId)
      if (project && project.requiredRoles) {
          project.requiredRoles = project.requiredRoles.filter(r => r.id !== requirementId)
          return HttpResponse.json({ data: { removeProjectRequirement: true } })
      }
      return HttpResponse.json({ errors: ['NotFound'] }, { status: 404 })
  }),

  graphql.mutation('AddRequirementSkill', ({ variables }) => {
      const { projectId, requirementId, skillName, level } = variables
      const project = projects.find(p => p.id === projectId)
      if (project && project.requiredRoles) {
          const req = project.requiredRoles.find(r => r.id === requirementId)
          if (req) {
              const newSkill = {
                  id: 'rsk-' + Math.random().toString(36).substr(2, 5),
                  name: skillName,
                  level
              }
              if (!req.skills) req.skills = []
              req.skills.push(newSkill)
              // Return structure matching GraphQL type
              return HttpResponse.json({ data: { addRequirementSkill: newSkill } })
          }
      }
      return HttpResponse.json({ errors: ['NotFound'] }, { status: 404 })
  }),

  graphql.mutation('RemoveRequirementSkill', ({ variables }) => {
      const { projectId, requirementId, skillId } = variables
      const project = projects.find(p => p.id === projectId)
      if (project && project.requiredRoles) {
          const req = project.requiredRoles.find(r => r.id === requirementId)
          if (req && req.skills) {
              req.skills = req.skills.filter(s => s.id !== skillId)
              return HttpResponse.json({ data: { removeRequirementSkill: true } })
          }
      }
      return HttpResponse.json({ errors: ['NotFound'] }, { status: 404 })
  }),

  graphql.mutation('AddCollaboratorSkill', ({ variables }) => {
      const { collaboratorId, skillName, level } = variables
      const collab = collaborators.find(c => c.id === collaboratorId)
      if (collab) {
          const newSkill = { 
              id: 'csk-' + Math.random().toString(36).substr(2, 5), 
              name: skillName, 
              level 
          }
          if (!collab.skills) collab.skills = []
          collab.skills.push(newSkill)
          return HttpResponse.json({ data: { addCollaboratorSkill: newSkill } })
      }
      return HttpResponse.json({ errors: ['NotFound'] }, { status: 404 })
  }),

  graphql.mutation('RemoveCollaboratorSkill', ({ variables }) => {
      const { collaboratorId, skillId } = variables
      const collab = collaborators.find(c => c.id === collaboratorId)
      if (collab && collab.skills) {
          collab.skills = collab.skills.filter(s => s.id !== skillId)
          return HttpResponse.json({ data: { removeCollaboratorSkill: true } })
      }
      return HttpResponse.json({ errors: ['NotFound'] }, { status: 404 })
  })
]
