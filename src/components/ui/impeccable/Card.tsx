import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: React.ReactNode;
  className?: string;
  elevation?: number; // 0-5 for shadow intensity
}

const Card = ({ title, children, className = '', elevation = 1, ...props }: CardProps) => {
  // Map elevation to Tailwind shadow classes
  const shadowClasses = [
    'shadow-none',      // 0
    'shadow-sm',        // 1
    'shadow-md',        // 2
    'shadow-lg',        // 3
    'shadow-xl',        // 4
    'shadow-2xl',       // 5
  ];

  const shadowClass = shadowClasses[elevation] || shadowClasses[1];

  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${shadowClass} ${className}`}
      {...props}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </div>
  );
};

export default Card;
