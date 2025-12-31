<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/extension-bubble-menu'
import StarterKit from '@tiptap/starter-kit'
import { watch, onBeforeUnmount } from 'vue'
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Undo, 
  Redo 
} from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  menuType: {
    type: String,
    default: 'fixed', // 'fixed' | 'bubble'
    validator: (value) => ['fixed', 'bubble'].includes(value)
  },
  placeholder: {
      type: String,
      default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'blur'])

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    BubbleMenu.configure({
        pluginKey: 'bubbleMenu',
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[100px] p-4 max-w-none',
    },
  },
  onUpdate: () => {
    emit('update:modelValue', editor.value.getHTML())
  },
  onBlur: () => {
      emit('blur')
  }
})

watch(() => props.modelValue, (value) => {
  const isSame = editor.value && editor.value.getHTML() === value
  if (editor.value && !isSame) {
    editor.value.commands.setContent(value, false)
  }
})

onBeforeUnmount(() => {
  if (editor.value) {
      editor.value.destroy()
  }
})

const items = [
    {
        icon: Bold,
        title: 'Bold',
        action: () => editor.value.chain().focus().toggleBold().run(),
        isActive: () => editor.value?.isActive('bold'),
    },
    {
        icon: Italic,
        title: 'Italic',
        action: () => editor.value.chain().focus().toggleItalic().run(),
        isActive: () => editor.value?.isActive('italic'),
    },
    {
        icon: Strikethrough,
        title: 'Strike',
        action: () => editor.value.chain().focus().toggleStrike().run(),
        isActive: () => editor.value?.isActive('strike'),
    },
    {
        type: 'divider',
    },
    {
        icon: Heading1,
        title: 'H1',
        action: () => editor.value.chain().focus().toggleHeading({ level: 1 }).run(),
        isActive: () => editor.value?.isActive('heading', { level: 1 }),
    },
    {
        icon: Heading2,
        title: 'H2',
        action: () => editor.value.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: () => editor.value?.isActive('heading', { level: 2 }),
    },
    {
        icon: Heading3,
        title: 'H3',
        action: () => editor.value.chain().focus().toggleHeading({ level: 3 }).run(),
        isActive: () => editor.value?.isActive('heading', { level: 3 }),
    },
    {
        type: 'divider',
    },
    {
        icon: List,
        title: 'Bullet List',
        action: () => editor.value.chain().focus().toggleBulletList().run(),
        isActive: () => editor.value?.isActive('bulletList'),
    },
    {
        icon: ListOrdered,
        title: 'Ordered List',
        action: () => editor.value.chain().focus().toggleOrderedList().run(),
        isActive: () => editor.value?.isActive('orderedList'),
    },
    {
      type: 'divider'  
    },
    {
        icon: Quote,
        title: 'Blockquote',
        action: () => editor.value.chain().focus().toggleBlockquote().run(),
        isActive: () => editor.value?.isActive('blockquote'),
    },
    {
        icon: Code,
        title: 'Code',
        action: () => editor.value.chain().focus().toggleCodeBlock().run(),
        isActive: () => editor.value?.isActive('codeBlock'),
    },
    {
        type: 'divider',
    },
    {
        icon: Undo,
        title: 'Undo',
        action: () => editor.value.chain().focus().undo().run(),
    },
    {
        icon: Redo,
        title: 'Redo',
        action: () => editor.value.chain().focus().redo().run(),
    },
]
</script>

<template>
  <div class="border rounded-lg overflow-hidden bg-white flex flex-col w-full h-full relative group">
    <div v-if="editor && menuType === 'fixed'" class="flex items-center gap-1 border-b bg-gray-50 p-2 flex-wrap">
      <template v-for="(item, index) in items">
          <div v-if="item.type === 'divider'" :key="`divider-${index}`" class="w-px h-6 bg-gray-300 mx-2"></div>
          <button 
            v-else
            :key="index"
            class="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
            :class="{ 'bg-gray-200 text-blue-600': item.isActive && item.isActive() }"
            @click="item.action"
            :title="item.title"
          >
            <component :is="item.icon" size="16" />
          </button>
      </template>
    </div>

    <bubble-menu
      v-if="editor && menuType === 'bubble'"
      :editor="editor"
      :tippy-options="{ duration: 100 }"
      class="flex items-center gap-1 bg-gray-800 text-white p-1 rounded-lg shadow-xl overflow-hidden"
    >
      <button 
        @click="editor.chain().focus().toggleBold().run()" 
        class="p-1.5 hover:bg-gray-700 rounded transition-colors"
        :class="{ 'text-blue-400': editor.isActive('bold') }"
      >
        <Bold size="16" />
      </button>
      <button 
        @click="editor.chain().focus().toggleItalic().run()" 
        class="p-1.5 hover:bg-gray-700 rounded transition-colors"
        :class="{ 'text-blue-400': editor.isActive('italic') }"
      >
        <Italic size="16" />
      </button>
      <div class="w-px h-4 bg-gray-600 mx-1"></div>
      <button 
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" 
        class="p-1.5 hover:bg-gray-700 rounded transition-colors"
        :class="{ 'text-blue-400': editor.isActive('heading', { level: 1 }) }"
      >
        <Heading1 size="16" />
      </button>
       <button 
        @click="editor.chain().focus().toggleBulletList().run()" 
        class="p-1.5 hover:bg-gray-700 rounded transition-colors"
        :class="{ 'text-blue-400': editor.isActive('bulletList') }"
      >
        <List size="16" />
      </button>
    </bubble-menu>

    <editor-content :editor="editor" class="flex-1 overflow-y-auto cursor-text text-sm" />
    
    <div v-if="!modelValue && placeholder && !editor?.isFocused" class="absolute top-4 left-4 text-gray-400 pointer-events-none text-sm">
        {{ placeholder }}
    </div>
  </div>
</template>

<style>
.ProseMirror p {
    margin-bottom: 0.5em;
}
.ProseMirror h1 {
    font-size: 1.5em;
    font-weight: bold;
    margin-top: 0.5em;
    margin-bottom: 0.5em;
}
.ProseMirror h2 {
    font-size: 1.25em;
    font-weight: bold;
    margin-top: 0.5em;
    margin-bottom: 0.5em;
}
.ProseMirror h3 {
    font-size: 1.1em;
    font-weight: bold;
    margin-top: 0.5em;
    margin-bottom: 0.5em;
}
.ProseMirror ul {
    list-style-type: disc;
    padding-left: 1.5em;
    margin-bottom: 0.5em;
}
.ProseMirror ol {
    list-style-type: decimal;
    padding-left: 1.5em;
    margin-bottom: 0.5em;
}
.ProseMirror blockquote {
    border-left: 3px solid #dfe2e5;
    padding-left: 1em;
    color: #6a737d;
    font-style: italic;
}
.ProseMirror pre {
    background: #f6f8fa;
    padding: 0.75em;
    border-radius: 0.375em;
    font-family: monospace;
    overflow-x: auto;
}
.ProseMirror code {
    background: rgba(175, 184, 193, 0.2);
    padding: 0.2em 0.4em;
    border-radius: 0.375em;
    font-family: monospace;
}
</style>
