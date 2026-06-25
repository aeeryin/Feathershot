cmake_minimum_required(VERSION 3.16)

project(Feathershot VERSION 1.2.6 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)

add_definitions(-DAPP_VERSION="${PROJECT_VERSION}")

find_package(Qt6 REQUIRED COMPONENTS Core Gui Widgets Network Svg PrintSupport)

set(RESOURCE_FILES
    resources/resources.qrc
)

set(SOURCES
    src/main.cpp
)

file(GLOB_RECURSE SOURCES_CXX src/core/*.cpp src/ui/*.cpp src/features/*.cpp)

file(GLOB_RECURSE UI_FILES src/ui/*.ui)

set(ICON_PATH "")
if(EXISTS "${CMAKE_SOURCE_DIR}/resources/icons/main.ico")
    set(ICON_PATH "${CMAKE_SOURCE_DIR}/resources/icons/main.ico")
elseif(EXISTS "${CMAKE_SOURCE_DIR}/resources/icons/main.png")
    set(ICON_PATH "${CMAKE_SOURCE_DIR}/resources/icons/main.png")
endif()

qt_add_executable(Feathershot
    ${SOURCES}
    ${SOURCES_CXX}
)

if(UI_FILES)
    qt_add_ui(Feathershot UI_FILES ${UI_FILES})
endif()

target_include_directories(Feathershot PRIVATE src/)

target_link_libraries(Feathershot PRIVATE Qt6::Core Qt6::Gui Qt6::Widgets Qt6::Network Qt6::Svg Qt6::PrintSupport)

if(EXISTS "${CMAKE_SOURCE_DIR}/${RESOURCE_FILES}")
    target_sources(Feathershot PRIVATE ${RESOURCE_FILES})
    set_source_files_properties(${RESOURCE_FILES} PROPERTIES AUTORCC ON)
endif()

if(ICON_PATH)
    set(CMAKE_RC_FLAGS "/I \"${ICON_PATH}\"")
    target_sources(Feathershot PRIVATE "${ICON_PATH}")
endif()

set_target_properties(Feathershot PROPERTIES
    OUTPUT_NAME "Feathershot"
    WIN32_EXECUTABLE TRUE
)
