// Project saving and loading utilities

export function saveProjectToStorage(projectName, nodes, edges, outputContent, outputHistory, rootNodeId) {
  const projectData = { 
    name: projectName, 
    nodes, 
    edges, 
    outputContent, 
    outputHistory, 
    rootNodeId, 
    timestamp: new Date().toISOString() 
  };
  
  localStorage.setItem(`mindcraft_project_${projectName}`, JSON.stringify(projectData));
  localStorage.setItem('mindcraft_last_project', projectName);
  
  const projects = JSON.parse(localStorage.getItem('mindcraft_projects') || '[]');
  const existingIndex = projects.findIndex(p => p.name === projectName);
  
  if (existingIndex >= 0) {
    projects[existingIndex] = { name: projectName, timestamp: projectData.timestamp };
  } else {
    projects.push({ name: projectName, timestamp: projectData.timestamp });
  }
  
  localStorage.setItem('mindcraft_projects', JSON.stringify(projects));
  
  return { success: true, timestamp: new Date() };
}

export function loadProjectFromStorage(projectName) {
  const projectData = localStorage.getItem(`mindcraft_project_${projectName}`);
  if (!projectData) return null;
  
  return JSON.parse(projectData);
}

export function deleteProjectFromStorage(projectName) {
  localStorage.removeItem(`mindcraft_project_${projectName}`);
  const projects = JSON.parse(localStorage.getItem('mindcraft_projects') || '[]');
  const updated = projects.filter(p => p.name !== projectName);
  localStorage.setItem('mindcraft_projects', JSON.stringify(updated));
  return updated;
}

export function loadProjectsList() {
  const projects = localStorage.getItem('mindcraft_projects');
  return projects ? JSON.parse(projects) : [];
}

export function loadLastProject() {
  const lastProjectName = localStorage.getItem('mindcraft_last_project');
  if (!lastProjectName) return null;
  
  return loadProjectFromStorage(lastProjectName);
}

export function exportProjectAsJSON(projectName, nodes, edges, outputContent, outputHistory, rootNodeId) {
  const projectData = { 
    name: projectName, 
    nodes, 
    edges, 
    outputContent, 
    outputHistory, 
    rootNodeId, 
    timestamp: new Date().toISOString() 
  };
  
  const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName.replace(/\s+/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}