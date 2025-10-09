export const INITIAL_FILES_DATA = [
  {
    name: 'src', type: 'folder', children: [
      {
        name: 'main.cpp', type: 'file', language: 'cpp', content:
          "#include \"core/Logger.h\"\n\n" +
          "int main() {\n" +
          "    Logger::log(\"Application started.\");\n" +
          "    // Main application logic here\n" +
          "    Logger::log(\"Application finished successfully.\");\n" +
          "    return 0;\n" +
          "}"
      },
      {
        name: 'utility.cpp', type: 'file', language: 'cpp', content:
          "#include \"../include/utility.h\"\n\n" +
          "int add(int a, int b) {\n" +
          "    return a + b;\n" +
          "}"
      },
    ]
  },
  {
    name: 'include', type: 'folder', children: [
      {
        name: 'utility.h', type: 'file', language: 'cpp', content:
          "#pragma once\n\n" +
          "int add(int a, int b);\n"
      },
      {
        name: 'core', type: 'folder', children: [
          {
            name: 'Logger.h', type: 'file', language: 'cpp', content:
              "#pragma once\n#include <iostream>\n\n" +
              "class Logger {\n" +
              "public:\n" +
              "    static void log(const std::string& message) {\n" +
              "        std::cout << \"[LOG] \" << message << std::endl;\n" +
              "    }\n" +
              "};\n"
          }
        ]
      }
    ]
  },
  {
    name: 'build', type: 'folder', children: [
      { name: '.gitkeep', type: 'file', language: 'plaintext', content: "Placeholder for build output" }
    ]
  },
  {
    name: 'CMakeLists.txt', type: 'file', language: 'cmake', content:
      "cmake_minimum_required(VERSION 3.10)\n" +
      "project(SimpleCppProject)\n\n" +
      "set(CMAKE_CXX_STANDARD 17)\n\n" +
      "include_directories(include)\n\n" +
      "add_executable(app src/main.cpp src/utility.cpp)\n"
  },
  {
    name: 'README.md', type: 'file', language: 'markdown', content:
      "# Simple C++ Project\n\n" +
      "A basic C++ project structure using CMake.\n"
  }
];