import React, { useState, useRef } from "react";
import Slider from "react-slick";
import { Box } from "@mui/material";
import { newColors } from "../../Themes/newColors";

const FilePreview = ({ files }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef(null);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    centerMode: true,
    arrows: false,
    centerPadding: "0",
    adaptiveHeight: true,
    beforeChange: (current, next) => setActiveIndex(next),
    customPaging: (i) => (
      <Box
        sx={{
          width: i === activeIndex ? "10px" : "10px",
          height: i === activeIndex ? "10px" : "10px",
          borderRadius: "50%",
          transition: "background-color 0.3s ease",
          cursor: "pointer",
          opacity: i === activeIndex ? 1 : 0.5,
          backgroundColor:
            i === activeIndex ? newColors.primary : newColors.text,
        }}
        onClick={() => sliderRef.current.slickGoTo(i)}
      />
    ),
    appendDots: (dots) => (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          marginTop: "10px 0px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: "5px",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {dots}
        </Box>
      </Box>
    ),
  };

  return (
    <Box
      sx={{
        mt: 1,
        color: newColors.text,
        borderRadius: "8px",
        padding: "10px",
      }}
    >
      <Slider ref={sliderRef} {...sliderSettings}>
        {files.map((filePath, index) => (
          <Box key={index} sx={{ mb: 1 }}>
            <img
              src={filePath}
              alt={`Uploaded Image ${index}`}
              style={{
                width: "100%",
                height: "350px",
                borderRadius: "8px",
                objectFit: "contain",
                backgroundColor: "#000000",
              }}
            />
          </Box>
        ))}
      </Slider>
    </Box>
  );
};

export default FilePreview;
