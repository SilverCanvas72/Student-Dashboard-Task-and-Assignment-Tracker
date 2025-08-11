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
        scheduledDate: null,
    }
};

// Executed when HTML is fully loaded
document.addEventListener("DOMContentLoaded", () => {

    const taskForm = document.getElementById("taskForm");
    const taskList = document.getElementById("taskList");
    const openFormBtn = document.getElementById("openTaskAddForm");
    const taskFormContainer = document.getElementById("taskFormContainer");

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

    const savedStreak = parseInt(localStorage.getItem('streakCount')) || 0;
    renderStreak(savedStreak);

    openFormBtn.addEventListener("click", () => {
    taskFormContainer.classList.toggle("taskform-hidden");
    });

    taskForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const title = document.getElementById("taskTitle").value;
        const subject = document.getElementById("taskSubject").value;
        const estimatedTime = parseInt(document.getElementById("taskEstimatedTime").value) || 0; //Converts Estimated Time String to integer so calculations can be done with it - only does it when the value is not zero so there are no errors
        const dueDate = document.getElementById("taskDueDate").value;
        const softDeadline = document.getElementById("taskSoftDeadline").value

        const task = createTask(title, subject, estimatedTime, dueDate, softDeadline);
        tasks.push(task);

        renderTasks();
        taskForm.reset();
});

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

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
        taskEl.innerHTML = `
        <strong>${task.title}</strong> (${task.subject || "Misc"})<br>
        Time Needed: ${task.estimatedTime} min
        `;
        todayDiv.appendChild(taskEl);        
    });

    document.querySelector(".todayhoursstat").textContent = (totalRemainingMinutes / 60).toFixed(1) + " hrs";
    document.querySelector(".todaytasks .todaytasksstat").textContent = incompleteCount + " tasks";
}

function renderUpcoming() {
    const upcomingDiv = document.querySelector(".upcoming-content");
    upcomingDiv.innerHTML = "";

    const upcomingTasks = getUpcomingTasks();

    upcomingTasks.forEach(task => {
        const taskEl = document.createElement("div");
        taskEl.innerHTML = `
            <strong>${task.title}</strong> (${task.subject || "Misc"})<br>
            Scheduled: ${formatDate(task.scheduledDate || "N/A")}<br>
            Soft Deadline: ${formatDate(task.softDeadline || "N/A")}<br>
            Final Deadline: ${formatDate(task.dueDate || "N/A")}
        `;
        upcomingDiv.appendChild(taskEl);
    })
}

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
                <input type="date" onchange="scheduleTask(${task.id}, this.value)">
                <button onclick="addTimeSpent(${task.id})">+15 min Studied</button>
                <button onclick="addEstimatedTime(${task.id})">+15 min Needed</button>
                <button onclick="toggleComplete(${task.id})">${task.completed ? "Uncheck" : "Mark Completed"}</button>
                <hr>
        `;
        taskList.appendChild(li);
    });
    updateStats();
    renderToday();
    renderUpcoming();
    saveTasks();
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
        streakElem.textContent = `🔥 Streak: ${streak} days`;
    }

}

// Pressing button adds 15 minutes to amount of time studied
window.addTimeSpent = function(id) {
    const task = tasks.find (t => t.id === id);
    if (task) {
        task.timeSpent += 15;
        renderTasks();
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
    const taskId = Number(id);
    const index = tasks.findIndex(t => t.id === taskId);

    if (index !== -1) {
        tasks.splice(index,1);
        updateStreak();
        renderTasks();
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
    return tasks.filter(t => t.scheduledDate === today);    
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

    totalHoursElem.textContent = (totalTime / 60).toFixed(1) + " hrs";
    totalTasksElem.textContent = completed + " tasks";
}

function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-AU", {weekday: 'short', day: 'numeric', month: 'short'});
}

});