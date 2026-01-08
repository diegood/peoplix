import gql from 'graphql-tag'

export const WorkPackageSchema = gql`
  type WorkPackage {
    id: ID!
    name: String!
    description: String
    projectId: String!
    tasks: [Task]
    recurrentEvents: [WorkPackageRecurrentEvent]
    history: [WorkPackageHistory]
    startDate: String
    endDate: String
    highLevelEstimation: Int
    status: String
    createdAt: String
    updatedAt: String
  }
  
  type WorkPackageHistory {
      id: ID!
      field: String
      oldValue: String
      newValue: String
      userId: String
      createdAt: String
  }

  type WorkPackageStatus {
      id: ID!
      name: String!
      color: String
      order: Int
      isClosed: Boolean
      organizationId: String!
  }

  type Task {
    id: ID!
    name: String!
    description: String
    workPackageId: String
    workPackage: WorkPackage
    functionalRequirementId: String
    functionalRequirement: FunctionalRequirement
    estimations: [TaskEstimation]
    startDate: String
    endDate: String
    estimatedHours: Float 
    collaboratorId: String
    collaborator: Collaborator
    dependencies: [Task]
    dependents: [Task]
  }

  type TaskEstimation {
    id: ID!
    taskId: String!
    roleId: String!
    role: Role
    hours: Float!
    startDate: String
    endDate: String
    collaboratorId: String
    collaborator: Collaborator
  }

  extend type Query {
    projectWorkPackages(projectId: ID!): [WorkPackage]
    workPackageStatuses(organizationId: ID!): [WorkPackageStatus]
    task(id: ID!): Task
  }

  extend type Mutation {
    createWorkPackage(projectId: ID!, name: String!, description: String, highLevelEstimation: Int, startDate: String): WorkPackage
    createWorkPackageFromRequirements(projectId: ID!, requirementIds: [ID!]!, name: String!, description: String, highLevelEstimation: Int, startDate: String): WorkPackage
    updateWorkPackage(id: ID!, name: String, description: String, highLevelEstimation: Int, startDate: String, status: String): WorkPackage
    deleteWorkPackage(id: ID!): Boolean

    createTask(workPackageId: ID, name: String!, description: String, startDate: String, collaboratorId: ID): Task
    updateTask(id: ID!, name: String, description: String, startDate: String, endDate: String, collaboratorId: ID): Task
    deleteTask(id: ID!): Boolean

    estimateTask(taskId: ID!, roleId: ID!, hours: Float!, startDate: String, endDate: String, collaboratorId: ID): Task
    
    addTaskDependency(taskId: ID!, predecessorId: ID!): Task
    removeTaskDependency(taskId: ID!, predecessorId: ID!): Task

    createWorkPackageStatus(organizationId: ID!, name: String!, color: String, order: Int, isClosed: Boolean): WorkPackageStatus
    updateWorkPackageStatus(id: ID!, name: String, color: String, order: Int, isClosed: Boolean): WorkPackageStatus
    deleteWorkPackageStatus(id: ID!): Boolean

    createWorkPackageRecurrentEvent(workPackageId: ID!, name: String!, type: String!, hours: Float!, startDate: String!, endDate: String, date: String, dayOfWeek: Int, dayOfMonth: Int): WorkPackageRecurrentEvent
    deleteWorkPackageRecurrentEvent(id: ID!): Boolean
  }

  type WorkPackageRecurrentEvent {
      id: ID!
      name: String!
      type: String!
      hours: Float!
      date: String
      dayOfWeek: Int
      dayOfMonth: Int
      startDate: String!
      endDate: String
      workPackageId: String!
  }
`
