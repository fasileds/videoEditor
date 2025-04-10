import React, { useState, useEffect } from "react";
import { Modal, Button, Row, Col, Input, Select } from "antd";
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  FontSizeOutlined,
} from "@ant-design/icons";

// Ant Design TextEditorModal Props
interface TextEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    text: string,
    style: React.CSSProperties,
    x: number,
    y: number
  ) => void;
}

const TextEditorModal: React.FC<TextEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [text, setText] = useState("");
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [position, setPosition] = useState({ x: 50, y: 50 }); // Default position

  // Handle Escape key to close the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle text formatting (bold, italic, underline, etc.)
  const handleStyleClick = (styleType: string) => {
    const newStyle = { ...style };
    switch (styleType) {
      case "BOLD":
        newStyle.fontWeight =
          newStyle.fontWeight === "bold" ? "normal" : "bold";
        break;
      case "ITALIC":
        newStyle.fontStyle =
          newStyle.fontStyle === "italic" ? "normal" : "italic";
        break;
      case "UNDERLINE":
        newStyle.textDecoration =
          newStyle.textDecoration === "underline" ? "none" : "underline";
        break;
      case "STRIKETHROUGH":
        newStyle.textDecoration =
          newStyle.textDecoration === "line-through" ? "none" : "line-through";
        break;
      case "FONT_SIZE":
        newStyle.fontSize = newStyle.fontSize === "16px" ? "20px" : "16px"; // Toggle between two sizes
        break;
      default:
        break;
    }
    setStyle(newStyle);
  };

  // Change text color
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStyle = { ...style, color: e.target.value };
    setStyle(newStyle);
  };

  // Change font family
  const handleFontChange = (fontFamily: string) => {
    const newStyle = { ...style, fontFamily };
    setStyle(newStyle);
  };

  // Change font size
  const handleFontSizeChange = (fontSize: string) => {
    const newStyle = { ...style, fontSize };
    setStyle(newStyle);
  };

  // Handle position change
  const handlePositionChange = (axis: "x" | "y", value: number) => {
    setPosition((prev) => ({ ...prev, [axis]: value }));
  };

  // Save content to text
  const handleSave = () => {
    onSave(text, style, position.x, position.y); // Pass text, style, and position to parent
    setText(""); // Clear the text after saving
    setStyle({}); // Reset styles
    setPosition({ x: 50, y: 50 }); // Reset position
    onClose(); // Close the modal
  };

  return (
    <Modal
      title="Edit Your Text"
      visible={isOpen}
      onCancel={onClose}
      footer={null}
      width="60%"
      className="text-editor-modal"
      styles={{
        body: {
          backgroundColor: "#f9f9f9", // Set a light background color for the modal body
          padding: "20px", // Add padding to the modal content
          borderRadius: "10px", // Smooth corners
          fontFamily: "Arial, sans-serif", // Apply a clean font family
        },
      }}
    >
      {/* Toolbar for text formatting */}
      <Row gutter={16} className="mb-4">
        <Col>
          <Button
            icon={<BoldOutlined />}
            onClick={() => handleStyleClick("BOLD")}
          />
        </Col>
        <Col>
          <Button
            icon={<ItalicOutlined />}
            onClick={() => handleStyleClick("ITALIC")}
          />
        </Col>
        <Col>
          <Button
            icon={<UnderlineOutlined />}
            onClick={() => handleStyleClick("UNDERLINE")}
          />
        </Col>
        <Col>
          <Button
            icon={<StrikethroughOutlined />}
            onClick={() => handleStyleClick("STRIKETHROUGH")}
          />
        </Col>
        <Col>
          <Button
            icon={<FontSizeOutlined />}
            onClick={() => handleStyleClick("FONT_SIZE")}
          />
        </Col>
        {/* Color Picker */}
        <Col>
          <input type="color" onChange={handleColorChange} />
        </Col>
        {/* Font Selection with Search */}
        <Col>
          <Select
            showSearch
            defaultValue="Arial"
            style={{ width: 120 }}
            onChange={handleFontChange}
            filterOption={(input, option) =>
              (option?.children as unknown as string)
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            <Select.Option value="Arial">Arial</Select.Option>
            <Select.Option value="Courier New">Courier New</Select.Option>
            <Select.Option value="Georgia">Georgia</Select.Option>
            <Select.Option value="Times New Roman">
              Times New Roman
            </Select.Option>
            <Select.Option value="Verdana">Verdana</Select.Option>
            <Select.Option value="Tahoma">Tahoma</Select.Option>
            <Select.Option value="Lucida Console">Lucida Console</Select.Option>
            <Select.Option value="Comic Sans MS">Comic Sans MS</Select.Option>
            <Select.Option value="Impact">Impact</Select.Option>
            <Select.Option value="Consolas">Consolas</Select.Option>
            <Select.Option value="Palatino">Palatino</Select.Option>
            <Select.Option value="Trebuchet MS">Trebuchet MS</Select.Option>
          </Select>
        </Col>
        {/* Font Size Selection with Search */}
        <Col>
          <Select
            showSearch
            defaultValue="16px"
            style={{ width: 120 }}
            onChange={handleFontSizeChange}
            filterOption={(input, option) =>
              (option?.children as unknown as string)
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            <Select.Option value="12px">12px</Select.Option>
            <Select.Option value="14px">14px</Select.Option>
            <Select.Option value="16px">16px</Select.Option>
            <Select.Option value="18px">18px</Select.Option>
            <Select.Option value="20px">20px</Select.Option>
            <Select.Option value="24px">24px</Select.Option>
            <Select.Option value="32px">32px</Select.Option>
            <Select.Option value="40px">40px</Select.Option>
            <Select.Option value="50px">50px</Select.Option>
          </Select>
        </Col>
      </Row>

      {/* Position Controls */}
      <Row gutter={16} className="mb-4">
        <Col>
          <Input
            type="number"
            placeholder="X Position"
            value={position.x}
            onChange={(e) =>
              handlePositionChange("x", parseInt(e.target.value))
            }
          />
        </Col>
        <Col>
          <Input
            type="number"
            placeholder="Y Position"
            value={position.y}
            onChange={(e) =>
              handlePositionChange("y", parseInt(e.target.value))
            }
          />
        </Col>
      </Row>

      {/* Text Area for content */}
      <Input.TextArea
        value={text}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setText(e.target.value)
        }
        rows={6}
        style={style}
      />

      {/* Buttons */}
      <div className="text-right mt-4">
        <Button className="mr-2" onClick={onClose}>
          Cancel
        </Button>
        <Button type="primary" onClick={handleSave}>
          Save
        </Button>
      </div>
    </Modal>
  );
};

export default TextEditorModal;
