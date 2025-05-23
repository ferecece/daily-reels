/**
 * Mapeo de índices de días de la semana
 * JavaScript: 0 = domingo, 1 = lunes, ..., 6 = sábado
 */
const dayIndexToName = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday'
};

/**
 * Mapeo de nombres de días de la semana a nombres en español
 */
const dayNameToSpanish = {
  sunday: 'Domingo',
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado'
};

/**
 * Formatea una hora a formato HH:MM
 * @param {number} hour - Hora (0-23)
 * @param {number} minute - Minuto (0-59)
 * @returns {string} Hora formateada
 */
const formatTime = (hour, minute) => {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

/**
 * Calcula la próxima hora de publicación basada en los horarios configurados por día
 * @param {Object} schedules - Objeto con horarios por día de la semana
 * @param {string} timezone - Zona horaria configurada
 * @returns {string} Texto con la próxima hora de publicación
 */
const parseTimeToNextPublication = (schedules, timezone = 'America/Santiago') => {
  if (!schedules) {
    return 'No configurado';
  }
  
  try {
    // Obtener fecha actual en la zona horaria configurada
    const now = new Date();
    const options = { timeZone: timezone };
    
    // Obtener hoy y hora actual en la zona horaria configurada
    const nowInTimezone = new Date(now.toLocaleString('en-US', options));
    const currentDay = nowInTimezone.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
    const currentHour = nowInTimezone.getHours();
    const currentMinute = nowInTimezone.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // Obtener el nombre del día actual
    const currentDayName = dayIndexToName[currentDay];
    
    // Obtener la hora programada para hoy
    const timeForToday = schedules[currentDayName];
    
    if (timeForToday) {
      const [hourToday, minuteToday] = timeForToday.split(':').map(Number);
      const todayTimeInMinutes = hourToday * 60 + minuteToday;
      
      // Si la hora de hoy aún no ha pasado
      if (todayTimeInMinutes > currentTimeInMinutes) {
        return `Hoy (${dayNameToSpanish[currentDayName]}) a las ${formatTime(hourToday, minuteToday)}`;
      }
    }
    
    // Si la hora de hoy ya pasó o no hay configuración para hoy, buscar el próximo día
    let nextDayIndex = (currentDay + 1) % 7;
    let daysAhead = 1;
    
    // Buscar hasta encontrar un día con hora configurada (máximo 7 días)
    while (daysAhead <= 7) {
      const nextDayName = dayIndexToName[nextDayIndex];
      const timeForNextDay = schedules[nextDayName];
      
      if (timeForNextDay) {
        const [hour, minute] = timeForNextDay.split(':').map(Number);
        
        if (daysAhead === 1) {
          return `Mañana (${dayNameToSpanish[nextDayName]}) a las ${formatTime(hour, minute)}`;
        } else {
          return `${dayNameToSpanish[nextDayName]} a las ${formatTime(hour, minute)}`;
        }
      }
      
      // Avanzar al siguiente día
      nextDayIndex = (nextDayIndex + 1) % 7;
      daysAhead++;
    }
    
    return 'No hay programaciones futuras configuradas';
  } catch (error) {
    console.error('Error al calcular próxima publicación:', error);
    return 'Error al calcular';
  }
};

module.exports = {
  parseTimeToNextPublication,
  formatTime
}; 