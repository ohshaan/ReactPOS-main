import React, { useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import "./style/ScreenKeyBoard.css";
import { Icon } from "@iconify/react";

/**
 * The `ScreenKeyBoard` function in JavaScript React renders a draggable virtual keyboard component
 * with customizable layouts and handles shift and caps lock buttons.
 * @returns The `ScreenKeyBoard` component is being returned. It consists of a draggable keyboard
 * interface that allows users to input text. The keyboard layout can switch between default and shift
 * modes, and it includes functionality to handle shift and caps lock buttons. The `onChange` function
 * is called when the keyboard input changes, passing the updated value to the parent component.
 * @param {Object} param0
 * @param {*} param0.type : The type is by default false so it will show qwerty keyboard and when true will show numeric
 * @param {*} param0.name : The name for the field which you are going to update
 * @param {*} param0.onChange :Pass the onchange function of the keyboard
 * @param {*} param0.keyboard : Pass the reference variable for the keyboard
 */
function ScreenKeyBoard({
  type,
  name,
  onChange,
  keyboard,
  position = "absolute",
  width = "50%",
  disabled = false,
  className,
  hideAble=true
}) {
  const keyboardRef = useRef(null);
  const [layout, setLayout] = useState("default");
  const [keyStatus,setKeyStatus]=useState(true)

  useEffect(()=>{
    !hideAble&&setKeyStatus(true);
  },[])


  const onKeyPress = (button) => {
    /**
     * If you want to handle the shift and caps lock buttons
     */
    if (button === "{shift}" || button === "{lock}") handleShift();
  };

  /**
   * The `handleShift` function toggles between "default" and "shift" layout names.
   */
  const handleShift = () => {
    const newLayoutName = layout === "default" ? "shift" : "default";
    setLayout(newLayoutName);
  };

  return (
    <>
    {keyStatus?<Draggable nodeRef={keyboardRef} disabled={disabled}>
      <div
        ref={keyboardRef}
        className={`${position} z-10 w-[${width}] bottom-0 bg-none shadow-lg cursor-move ${className}`}
      >
        {hideAble&&<div className="flex justify-end"><Icon icon="icon-park-solid:close-one" className="cursor-pointer" width="24" height="24" color="red" onClick={()=>setKeyStatus(prev=>!prev)} /></div>}
        <Keyboard
          onChange={(e) => onChange({ target: { name: name, value: e } })}
          keyboardRef={(r) => (keyboard.current = r)}
          layoutName={!type && layout}
          layout={
            type && {
              default: ["1 2 3", "4 5 6", "7 8 9", "{bksp} 0 {enter}"], // Only numbers, backspace, and enter
            }
          }
          onKeyPress={onKeyPress}
        />
      </div>
    </Draggable>:<div className="absolute bg-primary  text-white rounded-full cursor-pointer bottom-20 right-1" onClick={()=>setKeyStatus(prev=>!prev)}>
    <Icon icon="icon-park-twotone:keyboard" width="48" height="48" /></div>}
    </>
  );
}

export default ScreenKeyBoard;
