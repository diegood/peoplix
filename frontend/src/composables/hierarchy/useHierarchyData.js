
import { computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { GET_HIERARCHY_TYPES } from '@/modules/Rasci/graphql/allocation'
import { GET_ORG_HIERARCHY, GET_PROJECT_DETAILS } from '@/modules/Configuration/graphql/hierarchy.queries'

export function useHierarchyData(props, isOpen) {
    
    const { result: typesResult } = useQuery(GET_HIERARCHY_TYPES)
    const hierarchyTypes = computed(() => typesResult.value?.hierarchyTypes || [])

    const { result: projectDetailsResult } = useQuery(GET_PROJECT_DETAILS, () => ({
        id: props.project.id
    }), { 
        enabled: computed(() => !!props.project.id && isOpen.value),
        fetchPolicy: 'cache-and-network' 
    })

    const localProject = computed(() => projectDetailsResult.value?.project || props.project )
    const allocations = computed(() => localProject.value?.allocations || [])

    const { result: orgHierarchyResult } = useQuery(GET_ORG_HIERARCHY, () => ({
        organizationId: localProject.value?.organization?.id || props.project.organizationId
    }), { 
        enabled: computed(() => !!(localProject.value?.organization?.id || props.project.organizationId)),
        fetchPolicy: 'cache-and-network'
    })

    const orgHierarchy = computed(() => orgHierarchyResult.value?.orgHierarchy || [])

    const getDisplayName = (collab) => {
        if (!collab) return 'Desconocido'
        if (collab.firstName && collab.lastName) {
            return `${collab.firstName} ${collab.lastName}`
        }
        return collab.userName || collab.id
    }

    const allNodes = computed(() => {
        const map = new Map()
        allocations.value.forEach(a => map.set(a.collaborator.id, { ...a, isVirtual: false }))

        const addParents = (collaboratorId) => {
            const relations = orgHierarchy.value.filter(h => h.subordinate.id === collaboratorId)
            relations.forEach(rel => {
                const supervisorId = rel.supervisor.id
                if (!map.has(supervisorId)) {
                    map.set(supervisorId, {
                        id: `virtual-${supervisorId}`,
                        collaborator: rel.supervisor,
                        roles: rel.supervisor.roles || [],
                        supervisors: [],
                        subordinates: [],
                        isVirtual: true
                    })
                    addParents(supervisorId)
                }
            })
        }
        allocations.value.forEach(a => addParents(a.collaborator.id))
        return Array.from(map.values())
    })

    const getName = (allocId) => {
        const node = allNodes.value.find(a => a.id === allocId)
        return getDisplayName(node?.collaborator)
    }

    const getOrgSupervisors = (node) => {
        if (!node.collaborator) return []
        const orgRelations = orgHierarchy.value.filter(h => h.subordinate.id === node.collaborator.id)
        
        return orgRelations.map(h => {
            const supervisorNode = allNodes.value.find(n => n.collaborator.id === h.supervisor.id)
            if (!supervisorNode) return null
            return {
                id: 'org-' + h.id,
                isOrgLevel: true,
                hierarchyType: h.hierarchyType,
                supervisor: supervisorNode
            }
        }).filter(Boolean)
    }

    const activeSupervisors = (node) => {
        if (!node) return []
        const projectSupervisors = node.supervisors || []
        const orgSupervisors = getOrgSupervisors(node)
        const uniqueOrg = orgSupervisors.filter(orgR => 
            !projectSupervisors.some(projR => projR.supervisor.id === orgR.supervisor.id) 
            && !projectSupervisors.some(projR => projR.supervisor.collaborator.id === orgR.supervisor.collaborator.id) 
        )
        return [...projectSupervisors, ...uniqueOrg]
    }


    const buildTreeFrom = (rootNode, visitedIds = new Set()) => {
        if (visitedIds.has(rootNode.collaborator.id)) return null
        
        const newVisited = new Set(visitedIds)
        newVisited.add(rootNode.collaborator.id)
        
        const projectSubordinates = (rootNode.subordinates || []).map(rel => {
            const fullNode = allNodes.value.find(n => n.collaborator.id === rel.subordinate.collaborator?.id)
            if (!fullNode) return null
            return { ...rel, subordinate: fullNode, isOrgLevel: false }
        }).filter(Boolean)
        
        const orgSubRelations = orgHierarchy.value.filter(h => h.supervisor.id === rootNode.collaborator.id)
        
        const orgSubordinates = orgSubRelations.map(h => {
            const subNode = allNodes.value.find(n => n.collaborator.id === h.subordinate.id)
            if (!subNode) return null
            return {
                id: 'org-' + h.id,
                isOrgLevel: true,
                hierarchyType: h.hierarchyType,
                subordinate: subNode
            }
        }).filter(Boolean)

        const allRelations = [...projectSubordinates]
        orgSubordinates.forEach(orgRel => {
            const isDuplicate = allRelations.some(r => r.subordinate.collaborator.id === orgRel.subordinate.collaborator.id)
            if (!isDuplicate) allRelations.push(orgRel)
        })

        const children = allRelations.map(rel => {
            const subNodeTree = buildTreeFrom(rel.subordinate, newVisited)
            if (!subNodeTree) return null
            return {
                ...subNodeTree,
                relationName: rel.hierarchyType?.name || '?',
                relationColor: rel.hierarchyType?.color || 'bg-gray-100',
                uniqueKey: `${rootNode.id}-${rel.subordinate.id}-${rel.hierarchyType?.id}-${rel.isOrgLevel ? 'org' : 'proj'}`,
                isOrgLevel: rel.isOrgLevel
            }
        }).filter(Boolean)

        return {
            details: rootNode,
            children: children,
            uniqueKey: rootNode.id
        }
    }

    const treeRoots = computed(() => {
        const roots = allNodes.value.filter(n => {
            const sups = activeSupervisors(n)
            return sups.length === 0
        })
        return roots.sort((a,b) => {
            const nameA = getDisplayName(a.collaborator)
            const nameB = getDisplayName(b.collaborator)
            return nameA.localeCompare(nameB)
        })
    })

    const treeData = computed(() => {
        return treeRoots.value.map(root => buildTreeFrom(root)).filter(Boolean)
    })

    return {
        hierarchyTypes,
        localProject,
        allocations,
        orgHierarchy,
        allNodes,
        activeSupervisors,
        treeData,
        getDisplayName,
        getName
    }
}
