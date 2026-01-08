
import { print } from 'graphql';
import { AllocationSchema } from './typedefs/Allocation.js';
import { CollaboratorSchema } from './typedefs/Collaborator.js';
import { CustomFieldSchema } from './typedefs/CustomField.js';
import { HardwareSchema } from './typedefs/Hardware.js';
import { HierarchySchema } from './typedefs/Hierarchy.js';
import { HolidayCalendarSchema } from './typedefs/HolidayCalendar.js';
import { MilestoneSchema } from './typedefs/Milestone.js';
import { ProjectSchema } from './typedefs/Project.js';
import { RoleSchema } from './typedefs/Role.js';
import { SkillSchema } from './typedefs/Skill.js';
import { SprintSchema } from './typedefs/Sprint.js';
import { TechnologySchema } from './typedefs/Technology.js';
import { WorkCenterSchema } from './typedefs/WorkCenter.js';
import { AbsenceSchema } from './typedefs/Absence.js';
import { WorkPackageSchema } from './typedefs/WorkPackage.js';
import { AuthSchema } from './typedefs/Auth.js';
import { OrganizationSchema } from './typedefs/Organization.js';
import { KanbanSchema } from './typedefs/Kanban.js';
import FunctionalRequirementSchema from './typedefs/FunctionalRequirement.js';

const baseSchema = `
  scalar JSON

  type Query {
    _empty: String
  }
  
  type Mutation {
    _empty: String
  }

  type Subscription {
    _empty: String
  }
`;

export const schema = [
  baseSchema,
  print(AllocationSchema),
  print(CollaboratorSchema),
  print(CustomFieldSchema),
  print(HardwareSchema),
  print(HierarchySchema),
  print(HolidayCalendarSchema),
  print(MilestoneSchema),
  print(ProjectSchema),
  print(RoleSchema),
  print(SkillSchema),
  print(SprintSchema),
  print(TechnologySchema),
  print(WorkCenterSchema),
  print(AbsenceSchema),
  print(WorkPackageSchema),
  print(AuthSchema),
  print(OrganizationSchema),
  print(KanbanSchema),
  print(FunctionalRequirementSchema)
].join('\n');
