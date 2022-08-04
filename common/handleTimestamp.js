module.exports.handleTimestamp = () => {
  const date = new Date()

  let day = "0" + date.getDate();
  let month = "0" + (date.getMonth() + 1);
  let year = date.getFullYear();

  const dateStr = `${day.substr(-2)}.${month.substr(-2)}.${year}`;

  let hours = date.getHours();
  let minutes = "0" + date.getMinutes();
  let formattedTime = hours + ":" + minutes.substr(-2);

  return {formattedTime, dateStr}
}