const { createApp, ref, computed, watch } = Vue; 

// 專門用於 LocalStorage 的 Key
const STORAGE_KEY = 'nagoyaTripPlanner';

// --- 範例行程數據 (作為第一次載入時的預設值) ---
const initialTripData = {
    dailyItineraries: {
        '2026-02-04': [
            // 修正 type: 'flight' 的圖標和背景樣式
            { id: 1, type: 'flight', name: 'TPE 第一航廈起飛', time: '12:00', location: '桃園國際機場(TPE) - 名古屋中部國際機場(NGO)', details: { note: '表定: Choooo (國泰)' } },
            { id: 2, type: 'transport', name: '購買新特麗亞套票', time: '15:35', location: '中部國際機場國內航廈2樓', details: { note: '機場-岐阜(鐵路)-高山(巴士)' } },
            { id: 3, type: 'meal', name: '晚餐：自訂', time: '19:00', location: '高山市區', details: { note: '飛驒牛或蕎麥麵' } },
        ],
        '2026-02-05': [
            { id: 4, type: 'attraction', name: '宮川朝市', time: '9:30', location: '岐阜県高山市', details: { note: '請注意保暖，並準備前往新穗高' } },
            { id: 5, type: 'transport', name: '濃飛巴士往新穗高', time: '11:40', location: '濃飛巴士站', details: { note: '在H64 新穂高溫泉下車, 票價 2200' } },
            { id: 6, type: 'attraction', name: '雪屋祭', time: '19:00', location: '新穗高溫泉中尾', details: { note: '新穗高溫泉中尾雪屋祭' } },
        ],
        '2026-02-06': [
             { id: 7, type: 'attraction', name: '新穗高纜車', time: '9:00', location: '新穗高高空纜車', details: { note: '欣賞北阿爾卑斯雪景' } },
             { id: 8, type: 'meal', name: '高山清酒廠巡禮', time: '15:00', location: '原田酒造場', details: { note: '試飲活動，注意時間不要耽誤' } },
             { id: 9, type: 'meal', name: '晚餐：味の与平', time: '18:30', location: '岐阜県高山市上三之町105', details: { note: '本店官網菜單確認' } },
        ],
        '2026-02-07': [], 
        '2026-02-08': [],
        '2026-02-09': [],
    },
    accommodations: [
        { date: '2/4', name: 'ホテルアマネク飛騨高山', address: '岐阜県高山市花里町４‐７５‐３', tel: '0577-36-2222' },
        { date: '2/5', name: 'ホテル穂高', address: '岐阜県高山市奥飛騨温泉郷新穂高温泉', tel: '0578-89-2001' },
        { date: '2/6', name: 'ホテルアマネク飛騨高山', address: '岐阜県高山市花里町４‐７５‐３', tel: '0577-36-2222' },
        { date: '2/7 ~ 2/8', name: 'ベストウェスタンプラス名古屋栄', address: '愛知県名古屋市中区栄４丁目６－１', tel: '052-262-6000' },
    ],
    shoppingList: [
        { name: 'Moflin (シルバー)', location: 'ビックカメラ名古屋駅西店', price: 39800, acquired: false },
        { name: '清酒', location: '高山老街', price: null, acquired: false },
        { name: '名古屋限定蝦餅', location: '中部國際機場', price: null, acquired: false },
    ],
    expenses: [
        { category: '交通', name: '新特麗亞套票', date: '2026-02-04', amount: 5500, method: '現金', note: '機場-高山' },
        { category: '住宿', name: 'ホテルアマネク飛騨高山 (2晚)', date: '2026-02-04', amount: 30000, method: '信用卡', note: '總住宿費的一部分' },
        { category: '餐飲', name: '午餐', date: '2026-02-04', amount: 2000, method: '現金', note: '機場輕食' },
    ],
    exchangeRate: 0.22, 
};

// 取得每日的日期清單並排序
const tripDates = Object.keys(initialTripData.dailyItineraries).sort();

// 從 LocalStorage 載入資料，如果沒有則使用預設值
const loadTripData = () => {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            // 使用儲存的資料
            return JSON.parse(storedData);
        }
    } catch (e) {
        console.error("無法從 LocalStorage 載入資料:", e);
    }
    // 如果載入失敗或沒有資料，則使用預設值
    return initialTripData;
};


// --- Vue App 主體邏輯 ---
const App = {
    setup() {
        // 從 LocalStorage 載入資料
        const tripData = ref(loadTripData()); 
        
        const activeTab = ref('itinerary');
        
        // 確保 selectedDate 是一個有效的日期
        const validDates = Object.keys(tripData.value.dailyItineraries).sort();
        const selectedDate = ref(validDates[0] || tripDates[0]); // 使用最新的日期清單

        const isModalOpen = ref(false); 
        const isExportModalOpen = ref(false); // 【新增】匯出 Modal 狀態
        const isImportModalOpen = ref(false); // 【新增】匯入 Modal 狀態
        const exportData = computed(() => JSON.stringify(tripData.value, null, 2)); // 【新增】格式化匯出資料
        const importDataInput = ref(''); // 【新增】匯入資料的輸入欄位

        // 用於處理新增或編輯的表單資料
        const modalForm = ref({
            id: null, // 項目ID, null代表新增
            name: '',
            time: '',
            location: '',
            type: 'attraction',
            // 【新增】備註欄位
            note: '' 
        });

        // 深度監聽 tripData 變化，並將其儲存到 LocalStorage
        watch(tripData, (newVal) => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal));
            } catch (e) {
                console.error("無法儲存資料到 LocalStorage:", e);
            }
        }, { deep: true }); // deep: true 確保陣列內部的對象變化也能觸發儲存

        // 生成 Google Maps 連結
        const getMapUrl = (location) => {
            const encodedLocation = encodeURIComponent(location);
            return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
        };


        // 計算當前日期的天氣資訊 (這部分保持不變)
        const weatherInfo = computed(() => {
            const date = selectedDate.value;
            if (date === '2026-02-04') return { tempMax: 1, tempMin: -5, condition: '雪', location: '高山/名古屋', note: '體感: -3°C' };
            if (date === '2026-02-05') return { tempMax: 0, tempMin: -6, condition: '大雪', location: '新穗高', note: '體感: -5°C' };
            if (date === '2026-02-06') return { tempMax: 2, tempMin: -4, condition: '晴朗', location: '高山', note: '體感: -2°C' };
            if (date === '2026-02-07') return { tempMax: 6, tempMin: 0, condition: '多雲', location: '名古屋', note: '體感: 2°C' };
            if (date === '2026-02-08') return { tempMax: 7, tempMin: 1, condition: '小雨', location: '名古屋', note: '體感: 3°C' };
            if (date === '2026-02-09') return { tempMax: 8, tempMin: 2, condition: '晴朗', location: '名古屋', note: '體感: 4°C' };
            return { tempMax: '?', tempMin: '?', condition: '未知', location: '未知', note: '' };
        });

        // dateOptions 重新計算，確保使用最新的 tripData.dailyItineraries key
        const dateOptions = computed(() => {
             const currentTripDates = Object.keys(tripData.value.dailyItineraries).sort();
            return currentTripDates.map((date, index) => {
                const dayIndex = index + 1;
                const dayOfWeekIndex = new Date(date).getDay();
                const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][dayOfWeekIndex];
                
                // 將 "2026-02-04" 轉換為 "02/04"
                const parts = date.split('-'); // ['2026', '02', '04']
                const displayDate = `${parts[1]}/${parts[2]}`;

                return {
                    day: dayIndex,
                    date: date,
                    display: displayDate, // 這裡改為日期字串
                    dayOfWeek: dayOfWeek 
                };
            });
        });

        const currentItinerary = computed(() => {
            // 確保行程按時間排序
            const items = tripData.value.dailyItineraries[selectedDate.value] || [];
            return items.sort((a, b) => {
                const timeA = parseInt(a.time.replace(':', ''));
                const timeB = parseInt(b.time.replace(':', ''));
                return timeA - timeB;
            });
        });

        const accommodationList = computed(() => {
            return tripData.value.accommodations;
        });

        const shoppingList = computed(() => {
            return tripData.value.shoppingList;
        });

        const expenseList = computed(() => {
            return tripData.value.expenses.sort((a, b) => new Date(a.date) - new Date(b.date));
        });

        const totalExpenseJPY = computed(() => {
            return expenseList.value.reduce((sum, item) => sum + (item.amount || 0), 0);
        });

        const totalExpenseTWD = computed(() => {
            return (totalExpenseJPY.value * tripData.value.exchangeRate).toFixed(0);
        });
        
        const selectDate = (date) => {
            selectedDate.value = date;
        };

        const selectTab = (tab) => {
            activeTab.value = tab;
        };
        
        const toggleAcquired = (item) => {
            item.acquired = !item.acquired;
            // 由於我們 watch 了 tripData，這裡的修改會自動觸發 LocalStorage 儲存
        };

        // 重設表單狀態
        const resetModalForm = () => {
             modalForm.value = {
                id: null,
                name: '新增午餐/景點/交通',
                time: '12:30',
                location: '輸入地點或備註',
                type: 'attraction',
                note: '' // 【重設】備註欄位
            };
        };

        // 打開 Modal，用於新增
        const openModal = () => {
            if (activeTab.value !== 'itinerary') {
                alert("目前僅支援新增行程項目。");
                return;
            }
            resetModalForm();
            isModalOpen.value = true;
        };

        // 打開 Modal，用於編輯
        const openEditModal = (item) => {
            // 將要編輯的項目資料複製到表單狀態中
            modalForm.value = {
                id: item.id,
                name: item.name,
                time: item.time,
                location: item.location,
                type: item.type,
                // 【編輯時載入備註】
                note: item.details?.note || '' 
            };
            isModalOpen.value = true;
        };


        const closeModal = () => {
            isModalOpen.value = false;
        };

        // 【新增】匯出操作
        const openExportModal = () => {
            isExportModalOpen.value = true;
        };
        const closeExportModal = () => {
            isExportModalOpen.value = false;
        };
        // 【新增】複製匯出資料到剪貼簿 (僅作提示)
        const copyExportData = () => {
             navigator.clipboard.writeText(exportData.value).then(() => {
                alert('匯出資料已複製到剪貼簿。');
            }).catch(err => {
                alert('無法自動複製，請手動複製視窗中的文字。');
            });
        };

        // 【新增】匯入操作
        const openImportModal = () => {
             importDataInput.value = ''; // 清空上次的輸入
             isImportModalOpen.value = true;
        };
        const closeImportModal = () => {
            isImportModalOpen.value = false;
        };
        const handleImport = () => {
            try {
                const importedObj = JSON.parse(importDataInput.value);
                
                // 簡易驗證結構 (確保至少包含 dailyItineraries)
                if (!importedObj || !importedObj.dailyItineraries) {
                    throw new Error('資料結構錯誤');
                }

                // 將新資料儲存到 LocalStorage
                localStorage.setItem(STORAGE_KEY, JSON.stringify(importedObj));

                alert('資料匯入成功，即將重新整理頁面。');
                
                // 重新載入頁面以應用新資料
                window.location.reload(); 

            } catch (error) {
                alert(`資料匯入失敗！請確認貼上的文字是有效的 JSON 格式。\n錯誤訊息: ${error.message}`);
            } finally {
                closeImportModal();
            }
        };


        // 新增/編輯行程項目
        const saveItinerary = () => {
            const currentItineraryList = tripData.value.dailyItineraries[selectedDate.value];

            if (modalForm.value.id === null) {
                // 執行新增操作
                const maxId = currentItineraryList.reduce((max, item) => Math.max(max, item.id), 0);
                const newItem = {
                    id: maxId + 1,
                    type: modalForm.value.type,
                    name: modalForm.value.name,
                    time: modalForm.value.time,
                    location: modalForm.value.location,
                    // 【儲存備註】
                    details: { note: modalForm.value.note.trim() || ' (新增項目 - 已儲存)' }
                };

                // 將新項目推送到當前日期的行程陣列中
                currentItineraryList.push(newItem);
                alert(`已將「${newItem.name}」加入 ${selectedDate.value} 的行程，資料已自動儲存。`);

            } else {
                // 執行編輯操作
                const index = currentItineraryList.findIndex(item => item.id === modalForm.value.id);
                if (index !== -1) {
                    const itemToUpdate = currentItineraryList[index];
                    itemToUpdate.name = modalForm.value.name;
                    itemToUpdate.time = modalForm.value.time;
                    itemToUpdate.location = modalForm.value.location;
                    itemToUpdate.type = modalForm.value.type;
                    // 【更新備註】
                    itemToUpdate.details = { note: modalForm.value.note.trim() || '(已編輯 - 已儲存)' };
                    alert(`已更新行程項目「${itemToUpdate.name}」，資料已自動儲存。`);
                }
            }
            
            closeModal();
        };

        // 刪除行程項目
        const deleteItineraryItem = (itemToDelete) => {
            if (confirm(`確定要刪除「${itemToDelete.name}」這個行程項目嗎？資料會自動儲存變更。`)) {
                const itinerary = tripData.value.dailyItineraries[selectedDate.value];
                const index = itinerary.findIndex(item => item.id === itemToDelete.id);
                if (index !== -1) {
                    itinerary.splice(index, 1); // 從陣列中移除
                    alert(`「${itemToDelete.name}」已刪除，資料已自動儲存。`);
                }
            }
        };


        return {
            activeTab,
            selectedDate,
            dateOptions,
            weatherInfo,
            currentItinerary,
            accommodationList,
            shoppingList,
            expenseList,
            totalExpenseJPY,
            totalExpenseTWD,
            isModalOpen,
            isExportModalOpen, 
            isImportModalOpen, 
            exportData,        
            importDataInput,   
            modalForm, 

            selectTab,
            selectDate,
            toggleAcquired,
            openModal,
            openEditModal, 
            deleteItineraryItem, 
            closeModal,
            saveItinerary,
            getMapUrl,
            openExportModal, 
            closeExportModal, 
            copyExportData,   
            openImportModal, 
            closeImportModal, 
            handleImport,     
        };
    },

    template: `
        <div class="min-h-screen bg-gray-100">
            
            <div class="relative h-[250px] w-full">
                <img src="gassho_winter_banner.jpg" alt="名古屋六日遊橫幅" class="w-full h-full object-cover [filter:brightness(1.5)]">
                
                <h1 class="absolute top-8 left-4 text-white text-2xl font-bold z-10 [text-shadow:0_1px_3px_rgb(0_0_0_/_0.5)]">名古屋六日遊</h1>
            </div>

            <div class="relative -mt-10 z-20 rounded-t-3xl overflow-hidden bg-gray-100 min-h-[calc(100vh-240px)]">
                
                <div class="bg-white px-4 pt-3 pb-2 shadow-sm flex w-full justify-around">
                    <button @click="selectTab('itinerary')" :class="['flex-1 p-2 flex flex-col items-center', activeTab === 'itinerary' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-blue-600']">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                        <span class="text-xs mt-1">行程</span>
                    </button>
                    <button @click="selectTab('accommodation')" :class="['flex-1 p-2 flex flex-col items-center', activeTab === 'accommodation' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-blue-600']">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m8-10v12h4L20 9l-4-2z"></path></svg>
                        <span class="text-xs mt-1">資訊</span>
                    </button>
                    <button @click="selectTab('shopping')" :class="['flex-1 p-2 flex flex-col items-center', activeTab === 'shopping' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-blue-600']">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                        <span class="text-xs mt-1">購物</span>
                    </button>
                    <button @click="selectTab('expense')" :class="['flex-1 p-2 flex flex-col items-center', activeTab === 'expense' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-blue-600']">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        <span class="text-xs mt-1">花費</span>
                    </button>
                </div>

                <div class="p-4 pb-20">
                    
                    <div v-if="activeTab === 'itinerary'" class="flex flex-col space-y-4">
                        
                        <div class="flex overflow-x-auto space-x-2 scrollbar-hide py-1"> 
                            <div v-for="option in dateOptions" :key="option.date" @click="selectDate(option.date)"
                                 :class="['flex-shrink-0 w-[50px] h-14 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200 border',
                                          selectedDate === option.date ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50']">
                                <span class="text-[10px]">週{{ option.dayOfWeek }}</span>
                                <span class="text-sm font-bold leading-none">{{ option.display }}</span>
                            </div>
                        </div>

                        <div v-if="weatherInfo" class="bg-gradient-to-r from-blue-400 to-blue-500 p-4 rounded-xl shadow text-white">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-xs opacity-90">{{ selectedDate }} 天氣 ({{ weatherInfo.location }})</p>
                                    <div class="flex items-baseline mt-1">
                                        <span class="text-3xl font-bold">{{ weatherInfo.tempMax }}°</span>
                                        <span class="text-xl font-light opacity-80 mx-1">/</span>
                                        <span class="text-xl font-light opacity-80">{{ weatherInfo.tempMin }}°</span>
                                        <span class="ml-2 text-sm">{{ weatherInfo.condition }}</span>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <svg v-if="weatherInfo.condition.includes('雪')" class="w-8 h-8 inline-block opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12.5a.5.5 0 11-1 0 .5.5 0 011 0zm-5 0a.5.5 0 11-1 0 .5.5 0 011 0zm-5 0a.5.5 0 11-1 0 .5.5 0 011 0zM12 21a9 9 0 100-18 9 9 0 000 18z"></path></svg>
                                    <svg v-else-if="weatherInfo.condition.includes('晴')" class="w-8 h-8 inline-block opacity-90 text-yellow-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 7.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H8.25a.75.75 0 01-.75-.75zM3 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zM7.5 16.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H8.25a.75.75 0 01-.75-.75zM12 21.75a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM16.5 16.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM21 12a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zM16.5 7.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM12 7a5 5 0 100 10 5 5 0 000-10z"></path></svg>
                                    <p class="text-xs mt-1">{{ weatherInfo.note }}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex justify-center space-x-4 pt-2">
                             <button @click="openExportModal" class="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                                [匯出資料]
                            </button>
                            <button @click="openImportModal" class="px-3 py-1 text-sm font-medium text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors">
                                [匯入資料]
                            </button>
                        </div>
                        <div v-if="currentItinerary.length" class="space-y-4">
                            <template v-for="(item, index) in currentItinerary" :key="item.id">
                                <div :class="['p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start relative', item.type === 'flight' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800']">
                                    <div class="flex items-start space-x-3 overflow-hidden">
                                        <div class="mt-1 flex-shrink-0">
                                            <svg v-if="item.type === 'flight'" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                            <svg v-else-if="item.type === 'transport'" :class="['w-5 h-5', item.type === 'flight' ? 'text-white' : 'text-blue-500']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0l-4.243-4.243m10.121-5.172a1.998 1.998 0 00-2.828 0L10 14.121m4.121-4.121a1.998 1.998 0 00-2.828 0L10 14.121m0 0l-4.243 4.243m4.243-4.243l4.243-4.243"></path></svg>
                                            <svg v-else-if="item.type === 'attraction'" class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 11l3-3m0 0l3 3m-3-3v8m0-12a9 9 0 110 18 9 9 0 010-18z"></path></svg>
                                            <svg v-else-if="item.type === 'meal'" class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c1.657 0 3 .895 3 2s-1.343 2-3 2v5l-2-2m2-3V6m0 0h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        </div>
                                        
                                        <div class="flex-1 min-w-0">
                                            <p :class="['font-bold text-base truncate', item.type === 'flight' ? 'text-white' : 'text-gray-800']">{{ item.name }}</p>
                                            
                                            <a v-if="item.location" :href="getMapUrl(item.location)" target="_blank" 
                                               :class="['text-xs mt-0.5 truncate cursor-pointer transition-colors flex items-center', 
                                                        item.type === 'flight' ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800 underline']">
                                                <svg class="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>
                                                {{ item.location }} (地圖)
                                            </a>
                                            <div v-if="item.details && item.details.note && item.details.note.trim() !== '(已編輯 - 已儲存)'" 
                                                 :class="['mt-2 p-2 rounded-lg border flex items-start space-x-1.5',
                                                          item.type === 'flight' 
                                                          ? 'bg-blue-800 border-blue-700 text-white' // 航班：深藍色背景，白色文字
                                                          : 'bg-yellow-50 border-yellow-200 text-gray-700']"> <svg v-if="item.type === 'flight'" class="w-3.5 h-3.5 mt-0.5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                                 <svg v-else class="w-3.5 h-3.5 mt-0.5 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>

                                                 <p :class="['text-xs leading-relaxed', item.type === 'flight' ? 'text-white' : 'text-gray-700']">{{ item.details.note }}</p>
                                            </div>
                                            </div>
                                    </div>

                                    <div class="flex flex-col items-end flex-shrink-0 ml-2">
                                        <div :class="['text-sm font-mono', item.type === 'flight' ? 'text-white' : 'text-gray-900 font-semibold']">
                                            {{ item.time }}
                                        </div>
                                        
                                        <div v-if="item.type !== 'flight'" class="flex space-x-2 mt-2">
                                            <button @click.stop="openEditModal(item)" class="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-full bg-gray-50">
                                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                            </button>
                                            <button @click.stop="deleteItineraryItem(item)" class="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full bg-gray-50">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div v-if="index < currentItinerary.length - 1" class="pl-6 border-l-2 border-dashed border-gray-300 ml-6 h-6"></div>
                            </template>
                        </div>

                        <p v-else class="text-center text-gray-400 py-10">今日無行程安排</p>
                    </div>

                    <div v-else-if="activeTab === 'accommodation'" class="space-y-3">
                        <div v-for="(item, index) in accommodationList" :key="index" class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mb-2">{{ item.date }}</span>
                            <p class="text-lg font-bold text-gray-800">{{ item.name }}</p>
                            <a :href="getMapUrl(item.address)" target="_blank" class="flex items-start mt-2 text-gray-500 text-sm hover:text-blue-600 underline cursor-pointer">
                                <svg class="w-4 h-4 mt-0.5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0l-4.243-4.243m10.121-5.172a1.998 1.998 0 00-2.828 0L10 14.121m4.121-4.121a1.998 1.998 0 00-2.828 0L10 14.121m0 0l-4.243 4.243m4.243-4.243l4.243-4.243"></path></svg>
                                <span>{{ item.address }} (地圖)</span>
                            </a>
                        </div>
                    </div>

                    <div v-else-if="activeTab === 'shopping'" class="space-y-3">
                        <div v-for="(item, index) in shoppingList" :key="index" 
                             :class="['bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer', item.acquired ? 'bg-gray-50' : '']"
                             @click="toggleAcquired(item)">
                            <div class="flex items-center space-x-3">
                                <div :class="['w-5 h-5 rounded border flex items-center justify-center', item.acquired ? 'bg-green-500 border-green-500' : 'border-gray-300']">
                                    <svg v-if="item.acquired" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <div>
                                    <p :class="['font-medium', item.acquired ? 'text-gray-400 line-through' : 'text-gray-800']">{{ item.name }}</p>
                                    <a v-if="item.location" :href="getMapUrl(item.location)" target="_blank" class="text-xs text-gray-500 hover:text-blue-600 underline cursor-pointer">{{ item.location }} (地圖)</a>
                                </div>
                            </div>
                            <p v-if="item.price" class="text-sm font-bold text-gray-600">¥{{ item.price }}</p>
                        </div>
                    </div>

                    <div v-else-if="activeTab === 'expense'" class="space-y-3">
                        <div class="bg-gray-800 text-white p-5 rounded-2xl shadow-lg mb-4">
                            <p class="text-xs text-gray-400 uppercase tracking-wide">Total Expenses</p>
                            <div class="flex items-baseline mt-1">
                                <span class="text-2xl font-bold">¥</span>
                                <span class="text-4xl font-bold ml-1">{{ totalExpenseJPY.toLocaleString() }}</span>
                            </div>
                            <p class="text-sm text-gray-400 mt-1">≈ NT$ {{ totalExpenseTWD.toLocaleString() }}</p>
                        </div>

                        <div v-for="(item, index) in expenseList" :key="index" class="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                    <span class="text-xs font-bold">{{ item.category.substring(0,1) }}</span>
                                </div>
                                <div>
                                    <p class="font-bold text-gray-800 text-sm">{{ item.name }}</p>
                                    <p class="text-xs text-gray-500">{{ item.date }} • {{ item.method }}</p>
                                </div>
                            </div>
                            <p class="font-bold text-gray-800">-¥{{ item.amount.toLocaleString() }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <button @click="openModal" class="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full text-white shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-transform active:scale-95 z-30">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            </button>

            <div v-if="isModalOpen" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div @click.stop class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade">
                    <div class="p-6">
                        <h2 class="text-xl font-bold text-gray-800 mb-4">{{ modalForm.id === null ? '新增行程項目' : '編輯行程項目' }} ({{ dateOptions.find(d => d.date === selectedDate).display }})</h2>
                        
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">項目名稱</label>
                                <input type="text" v-model="modalForm.name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">時間 (HH:MM)</label>
                                <input type="text" v-model="modalForm.time" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">地點</label>
                                <input type="text" v-model="modalForm.location" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border">
                            </div>
                             <div>
                                <label class="block text-sm font-medium text-gray-700">備註/Note</label>
                                <textarea v-model="modalForm.note" rows="2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" placeholder="輸入航班資訊、預約號碼、提醒事項等..."></textarea>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">類型</label>
                                <select v-model="modalForm.type" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border">
                                    <option value="attraction">景點</option>
                                    <option value="meal">餐飲</option>
                                    <option value="transport">交通</option>
                                    <option value="flight">飛航</option>
                                </select>
                            </div>
                        </div>

                        <div class="mt-6 flex justify-end space-x-3">
                            <button @click="closeModal" class="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">取消</button>
                            <button @click="saveItinerary" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">{{ modalForm.id === null ? '儲存' : '更新' }}</button>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="isExportModalOpen" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div @click.stop class="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade">
                    <div class="p-6">
                        <h2 class="text-xl font-bold text-gray-800 mb-4">匯出行程資料 (備份/同步)</h2>
                        <p class="text-sm text-gray-600 mb-3">請複製下方文字框內**所有內容**，並儲存為備份檔案，或貼到其他裝置進行匯入。</p>
                        
                        <textarea :value="exportData" readonly rows="10" class="w-full font-mono text-xs p-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500"></textarea>

                        <div class="mt-4 flex justify-end space-x-3">
                            <button @click="closeExportModal" class="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">關閉</button>
                            <button @click="copyExportData" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">複製到剪貼簿</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div v-if="isImportModalOpen" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div @click.stop class="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade">
                    <div class="p-6">
                        <h2 class="text-xl font-bold text-gray-800 mb-4">匯入行程資料 (覆蓋現有資料)</h2>
                        <p class="text-sm text-red-600 mb-3 font-semibold">警告：匯入新資料將會**永久覆蓋**您目前瀏覽器中儲存的所有行程！</p>
                        
                        <textarea v-model="importDataInput" rows="10" placeholder="請貼上您備份的 JSON 格式行程資料..." class="w-full font-mono text-xs p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"></textarea>

                        <div class="mt-4 flex justify-end space-x-3">
                            <button @click="closeImportModal" class="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">取消</button>
                            <button @click="handleImport" :disabled="!importDataInput.trim()" :class="['px-4 py-2 text-sm font-medium text-white rounded-lg', importDataInput.trim() ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed']">確認匯入並重新整理</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

createApp(App).mount('#app');
