/*
  Project: TaskHarbour - Student Dashboard
  Author: Izzy de Wijn
  Description: Handles the logic and stoarge of data for the website
  Allows users to:
        + Add tasks and subtasks
        + Add subject folders
        + Schedule tasks
        + See tasks in the today and upcoming views
        + Navigate to individual subjects view
        + See statistics such as task and hours left in the day, total hours and tasks completed aswell as a streak showing how many days in a row the user has completed tasks
*/

let tasks = [];

// Purpose: Creates a new task with all needed variables - originally all set to zero or nothing
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
        scheduledDate: null,
    }
};

// Executed when HTML is fully loaded
document.addEventListener("DOMContentLoaded", () => {

    const taskForm = document.getElementById("taskForm");
    const taskList = document.getElementById("taskList");
    const openFormBtn = document.getElementById("openTaskAddForm");
    const taskFormContainer = document.getElementById("taskFormContainer");
    const subjectSelect = document.getElementById("taskSubjectSelect");
    const foldersContainer = document.querySelector(".folder-container");
    const addSubjectBtn = document.getElementById("addSubjectBtn");


    let subjects = [];
    let currentSubjectFilter = null;

    // Purpose: Loads subjects from default list aswell as ones already saved in the user's local storage
    function loadSubjects() {
        const s = localStorage.getItem('subjects');
        if (s) {
            try {
                subjects = JSON.parse(s);
            } catch {
                subjects = ["Misc", "Maths", "Science", "English"]; //Fallback subjects if there is an error
            }
        } else {
            subjects = ["Misc", "Maths", "Science", "English"]; //Default Subjects
        }
    }
    

    // Purpose: Saves subjects to local storage
    function saveSubjects() {
        localStorage.setItem('subjects', JSON.stringify(subjects));
    }

    // Purpose: Updates the subjects
    function updateSubjectSelect() {
        if (!subjectSelect) return;
        subjectSelect.innerHTML = "";
        subjects.forEach(sub => {
            const opt = document.createElement("option");
            opt.value = sub;
            opt.textContent = sub;
            subjectSelect.appendChild(opt);
        });
    }

        // Purpose: Renders subject button
    function renderSubjects() {
        if (!foldersContainer) return;
        foldersContainer.innerHTML = "";


        const transparentColors = {
        "red": "rgba(255, 0, 0, 0.05)",
        "green": "rgba(0, 128, 0, 0.05)",
        "orange": "rgba(255, 165, 0, 0.05)",
        "blue": "rgba(0, 0, 255, 0.05)"
    };

        const colors = ["red", "green", "blue", "orange"];
        subjects.forEach((sub, index) => {
            const btn = document.createElement("button");
            btn.className = "folder";
            btn.textContent = sub;
            const color = colors[index % colors.length]; // Picks the color for the folder based on its index
            btn.style.color = color; // asigns it text color
            btn.style.backgroundColor = transparentColors[color]; // assigns the same colour to its background colour but more transparent
            btn.addEventListener("click", () => {
                goToSubject(sub);
            });
            foldersContainer.appendChild(btn);
        });

        const addBtn = document.createElement("button");
        addBtn.className = "small-btn";
        addBtn.textContent = "+ Add subject";
        addBtn.style.marginTop = "8px";
        addBtn.style.color = 'white';
        addBtn.addEventListener("click", addSubjectPrompt);
        foldersContainer.appendChild(addBtn);
    }


// Purpose: Makes the form for users to add a subject or folder
function addSubjectPrompt() {
    const name = prompt("New subject name:");
    if(!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = subjects.some(s => s.toLowerCase() === trimmed.toLowerCase()); //prevents error with two subject/folders of the same name
    if (exists) {
        alert("That subject already exists.");
        return;
    }
    subjects.push(trimmed);
    saveSubjects();
    updateSubjectSelect();
    renderSubjects();
    if (subjectSelect) subjectSelect.value = trimmed;
}

// Purpose: Moves the user to the new 'page' as per the subject they clicked on
function goToSubject(sub) {
    const url = window.location.pathname + '?subject=' + encodeURIComponent(sub);
    window.location.href = url;
}

// Purpose: Brings back all element on the page - essentially redericting the user back to the homepage after being in subject view
function exitSubjectView() {
    window.location.href = window.location.pathname;
}

// Purpose: Populates the individual subject view aswell as hiding everything un-needed to make it appear as if the user has gone to a new page.
function enterSubjectView(sub) {
    document.body.classList.add('subject-mode');

    const openFormBtn = document.getElementById("openTaskAddForm");
    if (openFormBtn) openFormBtn.style.display = "none";

    const taskadd = document.querySelector('.taskadd');
    if(!taskadd) return;

    const existing = document.getElementById('subjectViewHeader');
    if (existing) existing.remove();

    const hdr = document.createElement('div');
    hdr.id = 'subjectViewHeader';
    hdr.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><button id="backToHome" type="button">← Back</button><h2 style="margin:0">${sub}</h2></div>`;
    taskadd.insertBefore(hdr, taskadd.firstChild);

    const backBtn = document.getElementById('backToHome');
    if (backBtn) backBtn.addEventListener('click', exitSubjectView);

    currentSubjectFilter = sub;
    updateSubjectSelect();
    renderTasks();
}


function getSubjectFromURL() {
    return new URLSearchParams(window.location.search).get('subject');
}

loadSubjects();
updateSubjectSelect();
renderSubjects();

if (addSubjectBtn) addSubjectBtn.addEventListener('click', addSubjectPrompt);

// Purpose: Gets tasks from local storage
const saved = localStorage.getItem("tasks");
    if (saved) {
        tasks = JSON.parse(saved);
        tasks.forEach(task => {  // This for loop stops the code from breaking when the tasks are reloaded from local storage
            task.id = Number(task.id);
            task.timeSpent = task.timeSpent || 0;
            task.estimatedTime = task.estimatedTime ||0;
            task.completed = task.completed || false;
            task.dueDate = task.dueDate || null;
            task.softDeadline = task.softDeadline || null;
            task.scheduledDate = task.scheduledDate || null;
        });
        renderTasks();
    }

let totalTimeAccumulated = parseInt(localStorage.getItem('totalTimeAccumulated')) || 0;
let totalTasksCompleted = parseInt(localStorage.getItem('totalTasksCompleted')) || 0;

const totalHoursElem = document.getElementById("totalhoursstat");
const totalTasksElem = document.getElementById("totaltasksstat");


// Purpose: Render the statistics from javascript variables into stats class in html
function renderStats() {
    if (totalHoursElem) totalHoursElem.textContent = (totalTimeAccumulated / 60).toFixed(1) +" hrs";
    if (totalTasksElem) totalTasksElem.textContent = totalTasksCompleted + " tasks";
}

renderStats();

const subjectParam = getSubjectFromURL();
if (subjectParam) {
    enterSubjectView(subjectParam);
} else{
    const openFormBtn = document.getElementById("openTaskAddForm");
    if (openFormBtn) openFormBtn.style.display = "";
}


document.getElementById("addSubjectBtn").addEventListener("click", addSubjectPrompt)


    const savedStreak = parseInt(localStorage.getItem('streakCount')) || 0;
    renderStreak(savedStreak);

    openFormBtn.addEventListener("click", () => {
    taskFormContainer.classList.toggle("taskform-hidden");
    });

    taskForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const title = document.getElementById("taskTitle").value;
        const subject = document.getElementById("taskSubjectSelect").value;
        const estimatedTime = parseInt(document.getElementById("taskEstimatedTime").value) || 0; //Converts Estimated Time String to integer so calculations can be done with it - only does it when the value is not zero so there are no errors
        const dueDate = document.getElementById("taskDueDate").value;
        const softDeadline = document.getElementById("taskSoftDeadline").value

        const task = createTask(title, subject, estimatedTime, dueDate, softDeadline);
        tasks.push(task);

        renderTasks();
        taskForm.reset();
});

// Purpose: Saves tasks into local storage
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Purpose: Adds tasks that are scheduled today to the today view
function renderToday() {
    const todayDiv = document.querySelector(".today-content");
    todayDiv.innerHTML = "";

    const todayTasks = getTodayTasks();
    
    let totalRemainingMinutes =0;
    let incompleteCount = 0;


    todayTasks.forEach(task => {
        const remaining = Math.max(task.estimatedTime - task.timeSpent, 0);
        totalRemainingMinutes += remaining;

        if (!task.completed){
            incompleteCount++
        }

        const taskEl = document.createElement("div");
        taskEl.style.marginBottom = "12px";

        taskEl.innerHTML=`
        <strong>${task.title}</strong> (${task.subject || "Misc"})<br>
        Time Needed: ${task.estimatedTime} min
        `;
        
        const ul = document.createElement("ul");
        ul.style.marginLeft = "20px";

        task.subtasks.forEach(subtask => {
            const li = document.createElement("li");
            li.style.marginBottom = "4px";

            li.innerHTML = `
                <input type="checkbox" ${subtask.completed ? "checked" : ""} onchange="toggleSubtaskComplete(${task.id}, ${subtask.id})">
                <strong>${subtask.title}</strong>
            `;

            ul.appendChild(li);
        });

        taskEl.appendChild(ul);
        todayDiv.appendChild(taskEl);
    });

    document.querySelector(".todayhoursstat").textContent = (totalRemainingMinutes / 60).toFixed(1) + " hrs";
    document.querySelector(".todaytasks .todaytasksstat").textContent = incompleteCount + " tasks";
}

// Purpose: Adds tasks that are scheduled or due in the next week to the today view
function renderUpcoming() {
    const upcomingDiv = document.querySelector(".upcoming-content");
    upcomingDiv.innerHTML = "";

    const upcomingTasks = getUpcomingTasks();

    upcomingTasks.forEach(task => {
        const taskEl = document.createElement("div");
        taskEl.style.marginBottom = "12px";
        taskEl.innerHTML = `
            <strong>${task.title}</strong> (${task.subject || "Misc"})<br>
            Scheduled: ${formatDate(task.scheduledDate || "N/A")}<br>
            Soft Deadline: ${formatDate(task.softDeadline || "N/A")}<br>
            Final Deadline: ${formatDate(task.dueDate || "N/A")}
        `;

        const ul = document.createElement("ul");
        ul.style.marginLeft = "20px";

        task.subtasks.forEach(subtask => {
            const li = document.createElement("li");
            li.style.marginBottom = "4px";

            li.innerHTML = `
                <input type="checkbox" ${subtask.completed ? "checked" : ""} onchange="toggleSubtaskComplete(${task.id}, ${subtask.id})">
                <strong>${subtask.title}</strong>
            `;

            ul.appendChild(li);
        });

        taskEl.appendChild(ul);
        upcomingDiv.appendChild(taskEl);
    });
}

// Purpose: Renders the tasks - sets what variables to display and where that are associated with each task
function renderTasks() {
    taskList.innerHTML = "";

    let filteredTasks = tasks;
    if (currentSubjectFilter) {
        filteredTasks = tasks.filter(task => task.subject === currentSubjectFilter);
    }

    filteredTasks.forEach(task => {
        const percentCompleted = task.estimatedTime > 0 ? Math.min((task.timeSpent / task.estimatedTime) * 100, 100) : 0;
        const li = document.createElement("li");
        li.innerHTML = `
                        <strong>${task.title}</strong> (${task.subject || "Misc"})<br>
                Time Spent: ${task.timeSpent} min<br>
                Time Needed: ${task.estimatedTime} min<br>
                <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                    <div style="background:#ddd; width: 150px; height:10px; border-radius:5px; overflow: hidden;">
                        <div style="background:#4caf50; width:${percentCompleted}%; height:100%; border-radius:5px 0 0 5px;"></div>
                    </div>
                    <div style="min-width: 40px; font-weight: bold;">${percentCompleted.toFixed(1)}%</div>
                </div>
                Deadline: ${task.dueDate || "N/A"}<br>
                Scheduled
                <input type="date" onchange="scheduleTask(${task.id}, this.value)"><br>
                <button onclick="addTimeSpent(${task.id})">+15 min Studied</button>
                <button onclick="addEstimatedTime(${task.id})">+15 min Needed</button>
                <button onclick="toggleComplete(${task.id})">${task.completed ? "Uncheck" : "Mark Completed"}</button>
                <hr>
                <div class="subtasks-container" id="subtasks-${task.id}">
                    <strong>Subtasks:</strong>
                    <ul id="subtask-list-${task.id}" style="margin-left: 20px;"></ul>
                    <button onclick="toggleAddSubtaskForm(${task.id})">+ Add Subtask</button>
                    <form id="add-subtask-form-${task.id}" style="display:none; margin-top: 8px;">
                    <input type="text" name="subtaskTitle" placeholder="Subtask title" required>
                    <button type="submit">Add</button>
                    </form>
                </div>                
        `;
        li.style.border = '1px solid #2A2A2E';
        li.style.borderRadius = '12px';
        taskList.appendChild(li);
        renderSubtasks(task);

        const addSubtaskForm = document.getElementById(`add-subtask-form-${task.id}`);
        if (addSubtaskForm) {
            addSubtaskForm.onsubmit = (e) => {
                e.preventDefault();
                const form = e.target;
                const title = form.subtaskTitle.value.trim();
                if (!title) return alert("Subtask title is required");

                addSubtask(task.id, title);

                form.reset();
                toggleAddSubtaskForm(task.id, false);
            };
        }
    });
    updateStats();
    renderToday();
    renderUpcoming();
    saveTasks();
}

window.toggleAddSubtaskForm = function(taskId, show) {
    const form = document.getElementById(`add-subtask-form-${taskId}`);
    if (!form) return;
    if (show === undefined) {
        form.style.display = form.style.display === "none" ? "block" : "none";
    } else {
        form.style.display = show ? "block" : "none";
    }
};

function addSubtask(taskId, title) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.subtasks.push({
        id: Date.now() + Math.floor(Math.random() * 1000), // unique id
        title,
        completed: false,
    });

    renderTasks();
    saveTasks();
}

function renderSubtasks(task) {
    const ul = document.getElementById(`subtask-list-${task.id}`);
    if (!ul) return;
    ul.innerHTML = "";

    task.subtasks.forEach(subtask => {
        const li = document.createElement("li");
        li.style.marginBottom = "6px";

        li.innerHTML = `
            <input type="checkbox" ${subtask.completed ? "checked" : ""} onchange="toggleSubtaskComplete(${task.id}, ${subtask.id})">
            <strong>${subtask.title}</strong>
        `;

        ul.appendChild(li);
    });
}

//Complete Subtask
window.toggleSubtaskComplete = function(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (!subtask) return;

    subtask.completed = !subtask.completed;
    renderTasks();
    saveTasks();
};

//Add 15 minutes to studied time on a subtask
window.addSubtaskTimeSpent = function(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (!subtask) return;

    subtask.timeSpent += 15;
    renderTasks();
    saveTasks();
};

// Add 15 minutes to the estimated time for a subtask
window.addSubtaskEstTime = function(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (!subtask) return;

    subtask.estimatedTime += 15;
    renderTasks();
    saveTasks();
};

//Schedule a subtasks
window.updateSubtaskScheduledDate = function(taskId, subtaskId, date) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (!subtask) return;

    subtask.scheduledDate = date;
    renderTasks();
    saveTasks();
};


// Pressing button adds 15 minutes to amount of time studied
window.addTimeSpent = function(id) {
    const task = tasks.find (t => t.id === id);
    if (task) {
        task.timeSpent += 15;

        totalTimeAccumulated += 15;
        localStorage.setItem('totalTimeAccumulated', totalTimeAccumulated);
        renderTasks();
        renderStats();
        saveTasks();
    }
};

// Pressing button adds 15 minutes to amount of time a task is estimaeted to take
window.addEstimatedTime = function(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.estimatedTime += 15;
        renderTasks();
        saveTasks();
    }
};

// Completing or 'checking off' a task
window.toggleComplete = function(id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
        const task = tasks[index];
        if (!task.completed) {
            totalTasksCompleted += 1;
            totalTimeAccumulated += task.timeSpent;
            localStorage.setItem('totalTasksCompleted', totalTasksCompleted);
            localStorage.setItem('totalTimeAccumulated', totalTimeAccumulated);
        }
        tasks.splice(index, 1);
        updateStreak();
        renderTasks();
        renderStats();
        saveTasks();
    }
};


window.scheduleTask = function(id, date){
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.scheduledDate = date;
        renderTasks();
        saveTasks();
    }
};

function getTodayTasks() {
    const today = new Date().toISOString().split("T")[0];
    return tasks.filter(t => 
        t.scheduledDate === today ||    // tasks scheduled for today
        t.dueDate === today              // tasks with deadline today
    );
}

function getUpcomingTasks(){
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate()+7);

    return tasks.filter(t => {
        const scheduled = new Date(t.scheduledDate);
        const soft = new Date (t.softDeadline);
        const hard = new Date(t.dueDate);

        return (
            (t.scheduledDate && scheduled >= now && scheduled <= sevenDaysFromNow) ||
            (t.softDeadline && soft >= now && soft <= sevenDaysFromNow) ||
            (t.dueDate && hard >= now && hard <= sevenDaysFromNow) 
        );
    })
}

function updateStats() {
    const totalHoursElem = document.getElementById("totalhoursstat");
    const totalTasksElem = document.getElementById("totaltasksstat");

    const totalTime = tasks.reduce((acc, t) => acc + t.timeSpent, 0);
    const completed = tasks.filter(t => t.completed).length;

    if (totalHoursElem) totalHoursElem.textContent = (totalTime / 60).toFixed(1) + " hrs";
        if (totalTasksElem) totalTasksElem.textContent = completed + " tasks";
}

function updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = localStorage.getItem('lastStudyDate');
    let streak = parseInt(localStorage.getItem('streakCount')) || 0;

    if (lastDate === today) {
        // Makes sure that the streak is not updated again if it has already been updated in the day
        return;
    } else if (lastDate === getYesterdayDate()) {
        streak += 1;
    } else {
        streak = 1;
    }

    localStorage.setItem('streakCount', streak);
    localStorage.setItem('lastStudyDate', today);
    renderStreak(streak);
}

function getYesterdayDate() {
    const date = new Date();
    date.setDate(date.getDate() -1);
    return date.toISOString().split('T')[0];
}


function renderStreak(streak) {
    const streakElem = document.getElementById('streakDisplay');
    if (streakElem) {
        streakElem.textContent = `Streak: ${streak} days`;
    }

}

function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-AU", {weekday: 'short', day: 'numeric', month: 'short'});
}

renderTasks();
renderSubjects();

});