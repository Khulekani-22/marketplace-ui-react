import PropTypes from "prop-types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Icon } from "@iconify/react";

function SortableTask({ id, task, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  const handleEdit = () => onEdit?.(task);
  const handleDelete = () => onDelete?.(task?.id || id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className='kanban-card bg-neutral-50 p-16 radius-8 mb-24'
      id={id}
    >
      {task.image && (
        <div className='radius-8 mb-12 max-h-350-px overflow-hidden'>
          <img src={task.image} alt='WowDash React Vite' className='w-100 h-100 object-fit-cover' />
        </div>
      )}
      <h6 className='kanban-title text-lg fw-semibold mb-8'>{task.title}</h6>
      <p className='kanban-desc text-secondary-light'>{task.description}</p>
      <button
        type='button'
        className='btn text-primary-600 border rounded border-primary-600 bg-hover-primary-600 text-hover-white d-flex align-items-center gap-2'
      >
        <Icon icon='lucide:tag' className='icon' />
        <span className='kanban-tag fw-semibold'>{task.tag}</span>
      </button>
      <div className='mt-12 d-flex align-items-center justify-content-between gap-10'>
        <div className='d-flex align-items-center justify-content-between gap-10'>
          <Icon icon='solar:calendar-outline' className='text-primary-light' />
          <span className='start-date text-secondary-light'>{task.date}</span>
        </div>
        <div className='d-flex align-items-center justify-content-between gap-10'>
          <button type='button' className='card-edit-button text-success-600' onClick={handleEdit}>
            <Icon icon='lucide:edit' className='icon text-lg line-height-1' />
          </button>
          <button type='button' className='card-delete-button text-danger-600' onClick={handleDelete}>
            <Icon icon='fluent:delete-24-regular' className='icon text-lg line-height-1' />
          </button>
        </div>
      </div>
    </div>
  );
}

SortableTask.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  task: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    description: PropTypes.string,
    image: PropTypes.string,
    tag: PropTypes.string,
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

SortableTask.defaultProps = {
  onEdit: undefined,
  onDelete: undefined,
};

export default SortableTask;
