let tasks = [];

function createTask (title, subject, estimatedTime, dueDate, softDeadline) {
    return {
        id: Date.now(),
        title,
        subject,
        estimatedTime,
        timeSpent: 0,
        dueDate,
        softDeadline,
        subtasks: [],
        completed: false,
    }
};

// Executed when HTML is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    const taskForm = document.getElementById("taskForm");
    const taskList = document.getElementById("taskList");


    // research what the e does?
    taskForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const title = document.getElementById("taskTitle").value;
        const subject = document.getElementById("taskSubject").value;
        const estimatedTime = parseInt(document.getElementById("taskEstimatedTime").value); //what does parseInt do?
        const dueDate = document.getElementById("taskDueDate").value;
        const softDeadline = document.getElementById("taskSoftDeadline").value

        const task = createTask(title, subject, estimatedTime, dueDate, softDeadline);
        tasks.push(task);

        renderTasks();
        taskForm.reset();
});

function renderTasks() {
    taskList.innerHTML = "";

    tasks.forEach(task => {
        const li = document.createElement("li");
        li.innerHTML = `
                <strong>${task.title}</strong> (${task.subject || "Misc"})<br>
                Time Spent: ${task.timeSpent} min<br>
                Time Needed: ${task.estimatedTime} min<br>
                Deadline: ${task.dueDate || "N/A"}<br>
                Status: ${task.completed ? "✅ Completed" : "⏳ In Progress"}<br>
                <button onclick="addTimeSpent(${task.id})">+15 min Studied</button>
                <button onclick="addEstimatedTime(${task.id})">+15 min Needed</button>
                <button onclick="toggleComplete(${task.id})">${task.completed ? "Uncheck" : "Mark Completed"}</button>
                <hr>
        `;
        taskList.appendChild(li);
    });
    updateStats();
}

// Pressing button adds 15 minutes to amount of time studied
window.addTimeSpent = function(id) {
    const task = tasks.find (t => t.id === id);
    if (task) {
        task.timeSpent += 15;
        renderTasks();
    }
};

// Pressing button adds 15 minutes to amount of time a task is estimaeted to take
window.addEstimatedTime = function(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.estimatedTime += 15;
        renderTasks();
    }
};

// Completing or 'checking off' a task
window.toggleComplete = function(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        renderTasks();
    }
};
function updateStats() {
    const totalHoursElem = document.getElementById("totalhoursstat");
    const totalTasksElem = document.getElementById("totaltasksstat");

    const totalTime = tasks.reduce((acc, t) => acc + t.timeSpent, 0);
    const completed = tasks.filter(t => t.completed).length;

    totalHoursElem.textContent = (totalTime / 60).toFixed(1) + " hrs";
    totalTasksElem.textContent = completed + " tasks";
}

});