
/**
 * The `clearFromBack` function removes the last element from an array using the `setData` function.
 * @param setData - The `setData` parameter is a function that is used to update the state in React. It
 * is typically provided by the `useState` hook in a functional component. When called with a new
 * value, it triggers a re-render of the component with the updated state. In the provided code
 * snippet, the
 */
const clearFromBack=(setData) => setData((prev) => prev.slice(0, prev?.length - 1));

/**
 * The function `resetDial` takes a `setData` function as a parameter and sets its data to an empty
 * string.
 * @param setData - The `setData` parameter is a function that is used to update the state '' to reset it.
 */
const resetDial=(setData)=> setData('');


export {clearFromBack,resetDial}
