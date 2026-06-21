import { HiOutlineCode, HiOutlineLightningBolt } from 'react-icons/hi';

export default function PortfolioProjectCard({ project }) {
  if (!project) return null;

  return (
    <div className="project-card">
      <div className="project-card-header">
        <div className="project-card-icon">
          <HiOutlineLightningBolt size={24} />
        </div>
        <div>
          <h3 className="project-card-name">
            Project Milestone: {project.name}
          </h3>
          <p className="project-card-milestone">This Week: {project.weekMilestone}</p>
        </div>
      </div>
      
      {project.techStack?.length > 0 && (
        <div className="mb-4">
          <div className="project-card-section-label">
            <HiOutlineCode /> Tech Stack
          </div>
          <div className="project-card-tech">
            {project.techStack.map((tech, i) => (
              <span key={i} className="project-card-tech-item">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {project.completionCriteria?.length > 0 && (
        <div>
          <div className="project-card-section-label">Completion Criteria</div>
          <ul className="project-card-criteria">
            {project.completionCriteria.map((crit, i) => (
              <li key={i}>{crit}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
