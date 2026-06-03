// Настройка прямого URL твоего Hugging Face Space (с косым слешем на конце)
const SERVER_URL = "https://olegbrysin-catrobat-api.hf.space/convert/";

// Поиск элементов интерфейса
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const statusText = document.getElementById('status');
const infoBox = document.getElementById('project-info');
const buildBtn = document.getElementById('build-btn');

let uploadedFile = null;

// При клике на зону активируем выбор файла через проводник
dropZone.addEventListener('click', () => fileInput.click());

// Отслеживание выбора файла
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        uploadedFile = e.target.files[0];
        processCatrobatFile(uploadedFile);
    }
});

// Drag and Drop события
dropZone.addEventListener('dragover', (e) => { 
    e.preventDefault(); 
    dropZone.style.background = '#e6f2ff'; 
});

dropZone.addEventListener('dragleave', () => { 
    dropZone.style.background = '#f9fbfd'; 
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.background = '#f9fbfd';
    if (e.dataTransfer.files.length > 0) {
        uploadedFile = e.dataTransfer.files[0];
        processCatrobatFile(uploadedFile);
    }
});

// Слушатель кнопки сборки
buildBtn.addEventListener('click', triggerAndroidBuild);

/**
 * Локальное чтение и парсинг структуры .catrobat архива через JSZip
 */
function processCatrobatFile(file) {
    if (!file) return;
    statusText.innerText = "Читаю файл...";
    statusText.style.color = "#4A90E2";

    const reader = new FileReader();
    reader.onload = function(event) {
        JSZip.loadAsync(event.target.result).then(function(zip) {
            statusText.innerText = "Файл успешно прочитан! 🎉";
            statusText.style.color = "green";
            
            document.getElementById('proj-name').innerText = file.name.replace('.catrobat', '');
            document.getElementById('proj-files').innerText = Object.keys(zip.files).length;
            infoBox.style.display = "block";
            buildBtn.style.display = "block";
        }).catch(() => {
            statusText.innerText = "Ошибка разбора файла. Убедись, что это архив .catrobat";
            statusText.style.color = "red";
            infoBox.style.display = "none";
            buildBtn.style.display = "none";
        });
    };
    reader.readAsArrayBuffer(file);
}

/**
 * Отправка реального файла на Hugging Face Space через FormData
 */
function triggerAndroidBuild() {
    if (!uploadedFile) {
        statusText.innerText = "Ошибка: сначала выберите файл проекта!";
        statusText.style.color = "red";
        return;
    }

    statusText.innerText = "Отправка файла на сервер компиляции... 📡";
    statusText.style.color = "#4A90E2";
    buildBtn.disabled = true;

    // Создаем контейнер FormData для загрузки бинарного файла на бэкенд
    const formData = new FormData();
    formData.append("file", uploadedFile);

    fetch(SERVER_URL, {
        method: 'POST',
        body: formData // Передаём файл напрямую бэкенду
    })
    .then(res => {
        if (!res.ok) throw new Error("Код ответа от сервера: " + res.status);
        return res.json();
    })
    .then(data => {
        if (data.status === "success" || data.success) {
            statusText.innerText = "УРА! Робот успешно запущен! Проверяй вкладку Actions на GitHub, сборка пошла! 🛠️";
            statusText.style.color = "green";
        } else {
            statusText.innerText = "Ошибка сервера: " + (data.message || "Не удалось обработать файл");
            statusText.style.color = "red";
            buildBtn.disabled = false;
        }
    })
    .catch((err) => {
        console.error(err);
        // Выводим реальную причину ошибки прямо на экран телефона
        statusText.innerText = "ТЕХНИЧЕСКАЯ ОШИБКА: " + err.message;
        statusText.style.color = "red";
        buildBtn.disabled = false;
    });
}
