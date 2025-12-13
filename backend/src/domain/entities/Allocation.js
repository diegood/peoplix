export class Allocation {
    constructor({ id, projectId, collaboratorId, dedicationPercentage, startWeek, endWeek, roles = [], collaborator = null, project = null }) {
        this.id = id;
        this.projectId = projectId;
        this.collaboratorId = collaboratorId;
        this.dedicationPercentage = dedicationPercentage;
        this.startWeek = startWeek;
        this.endWeek = endWeek;
        this.roles = roles;
        this.collaborator = collaborator;
        this.project = project;
    }
    
    get hours() {
        return (this.dedicationPercentage / 100) * 160;
    }
}
