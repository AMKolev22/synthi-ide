import { 
  Folder,
  FolderOpen,
} from 'lucide-react';

// VS Code Icons - clean and professional
import { 
  VscFile,
  VscFileCode,
  VscFileMedia,
  VscFilePdf,
  VscJson,
  VscMarkdown,
  VscGithub,
  VscDatabase,
  VscTerminal,
  VscFileZip,
} from 'react-icons/vsc';

// Font Awesome for colorful file type icons
import {
  FaJsSquare,
  FaPython,
  FaJava,
  FaPhp,
  FaHtml5,
  FaCss3Alt,
  FaSass,
  FaReact,
  FaGitAlt,
  FaDocker,
  FaFileAlt,
  FaFileImage,
  FaFilePdf,
  FaFileArchive,
  FaDatabase,
  FaFileCode,
  FaFileExcel,
} from 'react-icons/fa';

// Additional icons from Font Awesome 6
import {
  SiCplusplus,
  SiTypescript,
  SiRust,
  SiGo,
  SiRuby,
} from 'react-icons/si';

/**
 * Get the file extension from a filename
 */
const getExtension = (fileName) => {
  if (!fileName) return '';
  if (fileName.startsWith('.')) return fileName;
  return fileName.split('.').pop()?.toLowerCase() || '';
};

/**
 * Icon mapping for different file types with VS Code style colors
 */
const iconMap = {
  // C/C++
  'cpp': { icon: SiCplusplus, color: 'text-blue-400' },
  'cc': { icon: SiCplusplus, color: 'text-blue-400' },
  'cxx': { icon: SiCplusplus, color: 'text-blue-400' },
  'c': { icon: FaFileCode, color: 'text-blue-300' },
  'h': { icon: FaFileCode, color: 'text-purple-400' },
  'hpp': { icon: FaFileCode, color: 'text-purple-400' },
  
  // Java
  'java': { icon: FaJava, color: 'text-orange-400' },
  'class': { icon: FaJava, color: 'text-orange-400' },
  'jar': { icon: FaFileArchive, color: 'text-orange-500' },
  
  // JavaScript/TypeScript
  'js': { icon: FaJsSquare, color: 'text-yellow-300' },
  'mjs': { icon: FaJsSquare, color: 'text-yellow-300' },
  'cjs': { icon: FaJsSquare, color: 'text-yellow-300' },
  'jsx': { icon: FaReact, color: 'text-cyan-400' },
  'ts': { icon: SiTypescript, color: 'text-blue-400' },
  'tsx': { icon: FaReact, color: 'text-cyan-400' },
  
  // Python
  'py': { icon: FaPython, color: 'text-blue-400' },
  'pyc': { icon: FaPython, color: 'text-blue-300' },
  'pyw': { icon: FaPython, color: 'text-blue-400' },
  'pyx': { icon: FaPython, color: 'text-blue-400' },
  
  // C#
  'cs': { icon: FaFileCode, color: 'text-purple-400' },
  'csx': { icon: FaFileCode, color: 'text-purple-400' },
  
  // Go
  'go': { icon: SiGo, color: 'text-cyan-400' },
  
  // Rust
  'rs': { icon: SiRust, color: 'text-orange-400' },
  
  // Ruby
  'rb': { icon: SiRuby, color: 'text-red-400' },
  'erb': { icon: SiRuby, color: 'text-red-400' },
  
  // PHP
  'php': { icon: FaPhp, color: 'text-purple-300' },
  
  // Web
  'html': { icon: FaHtml5, color: 'text-orange-400' },
  'htm': { icon: FaHtml5, color: 'text-orange-400' },
  'css': { icon: FaCss3Alt, color: 'text-blue-400' },
  'scss': { icon: FaSass, color: 'text-pink-400' },
  'sass': { icon: FaSass, color: 'text-pink-400' },
  
  // Config/Data
  'json': { icon: VscJson, color: 'text-yellow-400' },
  'yaml': { icon: FaFileCode, color: 'text-pink-400' },
  'yml': { icon: FaFileCode, color: 'text-pink-400' },
  'xml': { icon: FaFileCode, color: 'text-orange-400' },
  'toml': { icon: FaFileAlt, color: 'text-gray-300' },
  'env': { icon: FaFileAlt, color: 'text-yellow-300' },
  
  // Shell scripts
  'sh': { icon: VscTerminal, color: 'text-green-400' },
  'bash': { icon: VscTerminal, color: 'text-green-400' },
  'zsh': { icon: VscTerminal, color: 'text-green-400' },
  'bat': { icon: VscTerminal, color: 'text-green-300' },
  'cmd': { icon: VscTerminal, color: 'text-green-300' },
  'ps1': { icon: VscTerminal, color: 'text-blue-400' },
  
  // Database
  'sql': { icon: FaDatabase, color: 'text-blue-400' },
  'db': { icon: FaDatabase, color: 'text-green-400' },
  'sqlite': { icon: FaDatabase, color: 'text-cyan-400' },
  
  // Documents
  'md': { icon: VscMarkdown, color: 'text-blue-300' },
  'markdown': { icon: VscMarkdown, color: 'text-blue-300' },
  'txt': { icon: FaFileAlt, color: 'text-gray-300' },
  'pdf': { icon: FaFilePdf, color: 'text-red-400' },
  'doc': { icon: FaFileAlt, color: 'text-blue-400' },
  'docx': { icon: FaFileAlt, color: 'text-blue-400' },
  
  // Spreadsheets
  'csv': { icon: FaFileExcel, color: 'text-green-400' },
  'xls': { icon: FaFileExcel, color: 'text-green-400' },
  'xlsx': { icon: FaFileExcel, color: 'text-green-400' },
  
  // Images
  'png': { icon: FaFileImage, color: 'text-purple-400' },
  'jpg': { icon: FaFileImage, color: 'text-purple-400' },
  'jpeg': { icon: FaFileImage, color: 'text-purple-400' },
  'gif': { icon: FaFileImage, color: 'text-pink-400' },
  'svg': { icon: FaFileImage, color: 'text-orange-400' },
  'ico': { icon: FaFileImage, color: 'text-blue-400' },
  'webp': { icon: FaFileImage, color: 'text-purple-300' },
  
  // Archives
  'zip': { icon: FaFileArchive, color: 'text-yellow-400' },
  'rar': { icon: FaFileArchive, color: 'text-yellow-400' },
  'tar': { icon: FaFileArchive, color: 'text-yellow-400' },
  'gz': { icon: FaFileArchive, color: 'text-yellow-400' },
  
  // Special files
  '.gitignore': { icon: FaGitAlt, color: 'text-orange-400' },
  '.env': { icon: FaFileAlt, color: 'text-yellow-300' },
  'dockerfile': { icon: FaDocker, color: 'text-cyan-400' },
  'makefile': { icon: FaFileCode, color: 'text-orange-400' },
  'readme.md': { icon: VscMarkdown, color: 'text-blue-400' },
};

/**
 * Get the appropriate icon for a file
 * @param {string} fileName - The name of the file
 * @returns {JSX.Element} - The icon component
 */
export const getFileIcon = (fileName) => {
  if (!fileName) {
    return <VscFile className="w-4 h-4 text-gray-400" />;
  }
  
  const lowerFileName = fileName.toLowerCase();
  
  // Check for exact filename match first (e.g., .gitignore, README.md)
  if (iconMap[lowerFileName]) {
    const { icon: Icon, color } = iconMap[lowerFileName];
    return <Icon className={`w-4 h-4 ${color}`} />;
  }
  
  // Get file extension
  const ext = getExtension(fileName);
  
  // Check for extension match
  if (ext && iconMap[ext]) {
    const { icon: Icon, color } = iconMap[ext];
    return <Icon className={`w-4 h-4 ${color}`} />;
  }
  
  // Default icon
  return <FaFileAlt className="w-4 h-4 text-gray-400" />;
};

/**
 * Folder icon component that changes based on open/closed state
 * @param {Object} props - Component props
 * @param {boolean} [props.isOpen=false] - Whether the folder is open
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {JSX.Element} - The folder icon component
 */
export const FolderIcon = ({ isOpen = false, className = '' }) => {
  const Icon = isOpen ? FolderOpen : Folder;
  return <Icon className={`w-4 h-4 text-yellow-500 ${className}`} />;
};