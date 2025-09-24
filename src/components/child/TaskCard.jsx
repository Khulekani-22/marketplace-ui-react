import PropTypes from "prop-types";
import { Draggable } from "@hello-pangea/dnd";
import { Icon } from "@iconify/react/dist/iconify.js";

const TaskCard = ({ task, index, onEdit, onDelete }) => {
  const handleEdit = () => onEdit?.(task);
  const handleDelete = () => onDelete?.(task.id);
  const displayDate = task.date ? new Date(task.date) : null;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          className='kanban-card bg-neutral-50 p-3 radius-8 mb-3'
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            userSelect: "none",
            background: snapshot.isDragging ? "#f0f0f0" : "#ffffff",
            ...provided.draggableProps.style,
          }}
        >
          {task.image && (
            <div
              className='radius-8 mb-2 overflow-hidden'
              style={{ maxHeight: "200px" }}
            >
              <img
                src={task.image}
                alt='WowDash React Vite'
                className='w-100 h-100 object-fit-cover'
              />
            </div>
          )}
          <h6 className='kanban-title text-lg fw-semibold pt-3 mb-2'>
            {task.title}
          </h6>
          <p className='kanban-desc text-secondary-light'>{task.description}</p>
          <button
            type='button'
            className='btn text-primary-600 border rounded border-primary-600 bg-hover-primary-600 text-hover-white d-flex align-items-center gap-2 mb-2'
          >
            <Icon icon='lucide:tag' className='icon text-lg'></Icon>
            <span className='kanban-tag fw-semibold'>{task.tag}</span>
          </button>
          <div className='d-flex align-items-center justify-content-between'>
            <div className='d-flex align-items-center gap-2 pt-3'>
              <Icon
                icon='solar:calendar-outline'
                className='icon text-lg line-height-1'
              ></Icon>
              <span className='start-date text-secondary-light'>
                {displayDate
                  ? displayDate.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "--"}
              </span>
            </div>
            <div className='d-flex align-items-center gap-2'>
              <button
                type='button'
                className='card-edit-button text-success-600'
                onClick={handleEdit}
              >
                <Icon icon='lucide:edit' className='icon text-lg'></Icon>
              </button>
              <button
                type='button'
                className='card-delete-button text-danger-600'
                onClick={handleDelete}
              >
                <Icon
                  icon='fluent:delete-24-regular'
                  className='icon text-lg line-height-1'
                ></Icon>
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

TaskCard.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    image: PropTypes.string,
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    tag: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

TaskCard.defaultProps = {
  onEdit: undefined,
  onDelete: undefined,
};

export default TaskCard;
